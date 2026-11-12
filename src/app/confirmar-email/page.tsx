"use client";

import { useEffect, useRef, useState } from "react";
import { Button, LoadingStatus, useAuth } from "@/components";
import { ApiError, errorMessage } from "@/lib/http";
import { confirmEmail } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
// Mesmo visual da tela de entrar
import styles from "../entrar/page.module.scss";

type State = "confirmando" | "confirmado" | "erro" | "sem-codigo";

/**
 * Abre pelo link do e-mail (#codigo=...). Confirma sozinha, sem formulário: a
 * pessoa só precisa abrir o link. O código vem depois do #, que o navegador não
 * envia a nenhum servidor, e sai da barra de endereço logo ao abrir.
 */
export default function ConfirmarEmailPage() {
  const { status, retry } = useAuth();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [state, setState] = useState<State>("confirmando");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.hash.slice(1)).get("codigo") ?? "";
    window.history.replaceState(null, "", window.location.pathname);
    if (!code) {
      setState("sem-codigo");
      return;
    }
    confirmEmail(code)
      .then(() => setState("confirmado"))
      .catch((err) => {
        setError(
          err instanceof ApiError && err.status === 400
            ? err.message || "Este link não vale mais. Peça um novo no Perfil."
            : errorMessage(err, "Não foi possível confirmar o e-mail. Tente de novo.")
        );
        setState("erro");
      });
  }, []);

  // Leva o foco ao título do resultado: o leitor de tela lê sozinho
  useEffect(() => {
    if (state !== "confirmando") titleRef.current?.focus();
    // Logado: atualiza os dados da conta, para o Perfil mostrar o e-mail confirmado
    if (state === "confirmado" && status === "logado") retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  if (state === "confirmando") {
    return (
      <main id="main-content" className={styles.main}>
        <LoadingStatus>Confirmando o seu e-mail...</LoadingStatus>
      </main>
    );
  }

  if (state === "confirmado") {
    return (
      <main id="main-content" className={styles.main}>
        <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
          E-mail confirmado
        </h1>
        <p className={styles.lead}>
          Pronto. Agora você também pode entrar com o Google usando este e-mail, na mesma
          conta.
        </p>
        <Button href={routes.decks} variant="primary" size="lg" block>
          Ir para Meus baralhos
        </Button>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.main}>
      <h1 ref={titleRef} tabIndex={-1} className={styles.title}>
        {state === "sem-codigo" ? "Link incompleto" : "Não foi possível confirmar"}
      </h1>
      <p role={state === "erro" ? "alert" : undefined} className={styles.lead}>
        {state === "sem-codigo"
          ? "Abra o link do e-mail inteiro, sem cortar o final. Se não funcionar, peça um link novo no Perfil."
          : error}
      </p>
      <Button href={status === "logado" ? routes.profile : routes.login} variant="primary" size="lg" block>
        {status === "logado" ? "Ir para o Perfil" : "Entrar"}
      </Button>
    </main>
  );
}
