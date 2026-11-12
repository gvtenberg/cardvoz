"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button, Input } from "@/components";
import { errorMessage } from "@/lib/http";
import { requestPasswordReset } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
// Mesmo visual da tela de entrar
import styles from "../entrar/page.module.scss";

export default function EsqueciSenhaPage() {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    const typed = email.trim();
    if (!typed || !typed.includes("@")) {
      setEmailError("Digite o e-mail da sua conta, como nome@exemplo.com.");
      emailRef.current?.focus();
      return;
    }
    setSubmitting(true);
    try {
      setSent(await requestPasswordReset(typed));
    } catch (err) {
      setError(errorMessage(err, "Não foi possível pedir o link. Tente de novo."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Navegação estrutural">
        <Link href={routes.login} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Voltar para entrar</span>
        </Link>
      </nav>
      <div>
        <h1 className={styles.title}>Esqueci minha senha</h1>
        <p className={styles.lead}>
          Digite o e-mail da sua conta. Vamos mandar um link para você criar uma nova
          senha. Se você entra com o Google, o link também serve para criar uma senha.
        </p>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {/* Mensagem que se explica sozinha, anunciada sem mover o foco */}
      <p role="status" className={sent ? styles.sent : "sr-only"}>
        {sent}
      </p>

      <div className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            ref={emailRef}
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError("");
            }}
            error={emailError}
          />
          <Button type="submit" variant="primary" size="lg" block aria-disabled={submitting || undefined}>
            {submitting ? "Enviando..." : sent ? "Enviar de novo" : "Enviar link"}
          </Button>
        </form>
      </div>
    </main>
  );
}
