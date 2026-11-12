"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button, PasswordInput } from "@/components";
import { ApiError, errorMessage } from "@/lib/http";
import { resetPassword } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
// Mesmo visual da tela de entrar
import styles from "../entrar/page.module.scss";

/** Código do link do e-mail. Vem depois do #, que o navegador não envia a nenhum servidor. */
function readCode(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.hash.slice(1)).get("codigo") ?? "";
}

export default function RedefinirSenhaPage() {
  const passwordRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const [code, setCode] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCode(readCode());
    // Tira o código da barra de endereço e do histórico: ele não fica à vista
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !code) return;
    setError("");
    if (password.length < 8) {
      setPasswordError("A senha precisa ter pelo menos 8 caracteres.");
      passwordRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(code, password);
      setDone(true);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 400
          ? err.message || "Este link não vale mais. Peça um novo em “Esqueci minha senha”."
          : errorMessage(err, "Não foi possível criar a nova senha. Tente de novo.");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (code === null) return <main id="main-content" className={styles.main} />;

  if (done) {
    return (
      <main id="main-content" className={styles.main}>
        <h1 ref={doneRef} tabIndex={-1} className={styles.title}>
          Senha nova criada
        </h1>
        <p className={styles.lead}>
          Pronto. Por segurança, as sessões abertas em outros aparelhos foram encerradas.
          Entre com o seu e-mail e a senha nova.
        </p>
        <Button href={routes.login} variant="primary" size="lg" block>
          Entrar
        </Button>
      </main>
    );
  }

  if (!code) {
    return (
      <main id="main-content" className={styles.main}>
        <h1 className={styles.title}>Link incompleto</h1>
        <p className={styles.lead}>
          Abra o link do e-mail inteiro, sem cortar o final. Se não funcionar, peça um link
          novo.
        </p>
        <Button href={routes.forgotPassword} variant="primary" size="lg" block>
          Pedir um link novo
        </Button>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.main}>
      <div>
        <h1 className={styles.title}>Criar uma nova senha</h1>
        <p className={styles.lead}>Use pelo menos 8 caracteres.</p>
      </div>

      {error && (
        <div className={styles.errorGroup}>
          <p role="alert" className={styles.error}>
            {error}
          </p>
          <Button href={routes.forgotPassword} variant="soft" size="md" block>
            Pedir um link novo
          </Button>
        </div>
      )}

      <div className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <PasswordInput
            ref={passwordRef}
            label="Nova senha"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
            }}
            error={passwordError}
          />
          <Button type="submit" variant="primary" size="lg" block aria-disabled={submitting || undefined}>
            {submitting ? "Salvando..." : "Salvar a nova senha"}
          </Button>
        </form>
      </div>
    </main>
  );
}
