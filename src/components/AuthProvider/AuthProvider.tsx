"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  REFRESH_TOKEN_KEY,
  forgetSession,
  getAccessToken,
  getRefreshToken,
  logout as endSession,
  onSessionChange,
  refreshSession,
  type SessionEndReason,
  type UserResponse,
} from "@/lib/auth/session";
import { errorMessage } from "@/lib/http";
import { reconnectAction, setActiveAccount, setOnline, syncAccount } from "@/lib/data";
import { clearSavedAccount, getSavedAccount, saveAccount } from "@/lib/local/account";
import { convertCopiesToDevice } from "@/lib/data/transfer";

/** "erro": havia sessão, mas não deu para conferir (sem internet, API fora do ar, limite de tentativas). */
export type AuthStatus = "carregando" | "logado" | "deslogado" | "erro";

interface AuthContextValue {
  status: AuthStatus;
  user: UserResponse | null;
  /** Por que a sessão acabou (null enquanto logado ou se nunca entrou) */
  endReason: SessionEndReason | null;
  /** Mensagem do status "erro" */
  restoreError: string;
  /** Tenta restaurar a sessão de novo (depois de um erro de conexão) */
  retry: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de <AuthProvider>.");
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("carregando");
  const [user, setUser] = useState<UserResponse | null>(null);
  const [endReason, setEndReason] = useState<SessionEndReason | null>(null);
  const [restoreError, setRestoreError] = useState("");

  /**
   * O accessToken fica só em memória e some ao recarregar a página: troca o
   * refreshToken guardado por um novo par. A resposta já traz a pessoa, então
   * não precisa chamar /auth/me. Até lá o status fica "carregando", para a tela
   * de entrar não aparecer por meio segundo antes da sessão voltar.
   */
  const restore = useCallback(() => {
    if (!getRefreshToken()) {
      setStatus("deslogado");
      return;
    }
    setStatus("carregando");
    refreshSession()
      .then((auth) => {
        if (!auth) setStatus("deslogado");
      })
      .catch((error) => {
        setRestoreError(
          errorMessage(error, "Não foi possível conferir sua sessão. Tente de novo em instantes.")
        );
        setStatus("erro");
      });
  }, []);

  useEffect(() => {
    const stop = onSessionChange((nextUser, reason) => {
      setUser(nextUser);
      setStatus(nextUser ? "logado" : "deslogado");
      setEndReason(nextUser ? null : (reason ?? null));
      // Sessão que terminou sem "Sair da conta" (30 dias, saída em outro aparelho):
      // vale como "Manter". Os baralhos continuam aqui, editáveis sem login, e a
      // lista avisa que a sessão terminou.
      if (!nextUser && reason === "expired") {
        const saved = getSavedAccount();
        if (saved) convertCopiesToDevice(saved.id, "sessao");
        clearSavedAccount();
      }
    });

    restore();

    // Sincroniza as abas: saiu numa, sai em todas; entrou numa, entra nas outras
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== REFRESH_TOKEN_KEY && event.key !== null) return;
      const hasToken = Boolean(getRefreshToken());
      if (!hasToken && getAccessToken()) {
        forgetSession("logout");
      } else if (hasToken && !getAccessToken()) {
        restore();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      stop();
      window.removeEventListener("storage", handleStorage);
    };
  }, [restore]);

  // Diz à camada de dados de quem são as cópias e se dá para falar com a API.
  // Sem internet com sessão salva ("erro") continua no modo conta: as edições
  // vão para a fila em vez de virarem baralhos só do aparelho.
  useEffect(() => {
    if (status === "logado" && user) {
      saveAccount({ id: user.id, name: user.name, email: user.email });
      setActiveAccount(getSavedAccount());
      setOnline(true);
      void syncAccount();
    } else if (status === "erro") {
      setActiveAccount(getSavedAccount());
      setOnline(false);
    } else if (status === "deslogado") {
      setActiveAccount(null);
      setOnline(false);
    }
  }, [status, user]);

  // Voltou a internet: se a sessão não pôde ser conferida (aberto sem internet),
  // confere de novo; logado, envia a fila e atualiza as cópias
  const statusRef = useRef(status);
  statusRef.current = status;
  useEffect(() => {
    const handleOnline = () => {
      const action = reconnectAction(statusRef.current);
      if (action === "restaurar") restore();
      else if (action === "sincronizar") void syncAccount();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [restore]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, endReason, restoreError, retry: restore, logout: endSession }),
    [status, user, endReason, restoreError, restore]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
