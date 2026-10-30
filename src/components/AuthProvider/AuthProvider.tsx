"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
import { setNotice } from "@/lib/notice";
import { setActiveAccount, setOnline, syncAccount } from "@/lib/data";
import { getSavedAccount, saveAccount } from "@/lib/local/account";

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
      if (!nextUser && reason) {
        setNotice(
          reason === "logout"
            ? "Você saiu da sua conta."
            : "Sua sessão terminou. Entre de novo para continuar."
        );
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

  // Voltou a internet: envia a fila e atualiza as cópias
  useEffect(() => {
    const handleOnline = () => void syncAccount();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, endReason, restoreError, retry: restore, logout: endSession }),
    [status, user, endReason, restoreError, restore]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
