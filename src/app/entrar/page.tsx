"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  GoogleButton,
  Input,
  LoadingStatus,
  PasswordInput,
  Skeleton,
  useAuth,
} from "@/components";
import { ApiError, errorMessage } from "@/lib/http";
import { loginWithGoogleCode, loginWithPassword } from "@/lib/auth/session";
import { getGoogleRedirectUri, isGoogleConfigured, readGoogleCallback } from "@/lib/auth/google";
import { markOfferTransfer, takeOfferTransfer } from "@/lib/data/transfer";
import { routes, safeRedirect } from "@/lib/routes";
import styles from "./page.module.scss";

function EntrarLoading({ message }: { message: string }) {
  return (
    <main id="main-content" className={styles.main}>
      <LoadingStatus>{message}</LoadingStatus>
      <div className={styles.skeleton} aria-hidden="true">
        <Skeleton width="70%" height="2.5rem" />
        <Skeleton width="90%" height="1.25rem" />
        <div className={styles.panel}>
          <Skeleton width="30%" height="1.25rem" />
          <Skeleton height="3.5rem" />
          <Skeleton width="30%" height="1.25rem" />
          <Skeleton height="3.5rem" />
          <Skeleton height="4.5rem" radius="9999px" />
        </div>
      </div>
    </main>
  );
}

function EntrarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const voltar = searchParams.get("voltar");
  const { status } = useAuth();

  // Voltando do Google (?code=... ou ?error=...): mostra "Entrando..." desde o início
  const [exchanging, setExchanging] = useState(
    () => searchParams.has("code") || searchParams.has("error")
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const handledRef = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const hasGoogle = isGoogleConfigured();

  useEffect(() => {
    // Roda uma vez só: o código do Google vale para uma única troca
    if (handledRef.current) return;
    handledRef.current = true;

    const callback = readGoogleCallback(new URLSearchParams(window.location.search));
    if (!callback) return;

    // Tira o código do endereço (e do histórico), mantendo só o "voltar"
    window.history.replaceState(
      null,
      "",
      callback.voltar ? routes.loginThenReturn(callback.voltar) : routes.login
    );

    if (callback.kind === "error") {
      setError(callback.message);
      setExchanging(false);
      return;
    }

    // Marca antes de entrar: ao ficar logado, o CardVoz pergunta se leva os baralhos do aparelho
    markOfferTransfer();
    loginWithGoogleCode({
      code: callback.code,
      codeVerifier: callback.verifier,
      redirectUri: getGoogleRedirectUri(),
    }).catch((err) => {
      takeOfferTransfer();
      setError(
        err instanceof ApiError ? err.message : "Não foi possível entrar. Tente de novo."
      );
      setExchanging(false);
    });
  }, []);

  // Já logado (sessão restaurada ou acabou de entrar): segue para onde ia
  useEffect(() => {
    if (status === "logado") router.replace(safeRedirect(voltar));
  }, [status, voltar, router]);

  const clearMessages = () => {
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    clearMessages();

    const typedEmail = email.trim();
    const nextEmailError = typedEmail ? "" : "Escreva seu e-mail.";
    const nextPasswordError = password ? "" : "Escreva sua senha.";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError) {
      emailRef.current?.focus();
      return;
    }
    if (nextPasswordError) {
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      // Ao dar certo, o AuthProvider fica logado e o efeito acima segue para "voltar"
      markOfferTransfer();
      await loginWithPassword({ email: typedEmail, password });
    } catch (err) {
      takeOfferTransfer();
      setSubmitting(false);
      if (err instanceof ApiError && err.status === 401) {
        setError(
          hasGoogle
            ? "E-mail ou senha incorretos. Se você criou a conta com o Google, toque em Entrar com Google."
            : "E-mail ou senha incorretos."
        );
        // Leva à senha para digitar de novo
        passwordRef.current?.focus();
      } else {
        setError(errorMessage(err, "Não foi possível entrar. Tente de novo."));
      }
    }
  };

  if (exchanging || status === "logado") {
    return <EntrarLoading message="Entrando..." />;
  }
  if (status === "carregando") {
    return <EntrarLoading message="Verificando sua sessão..." />;
  }

  return (
    <main id="main-content" className={styles.main}>
      <div>
        <h1 className={styles.title}>Entrar no CardVoz</h1>
        <p className={styles.lead}>
          {hasGoogle
            ? "Use seu e-mail e sua senha ou a sua conta Google."
            : "Use seu e-mail e sua senha."}
        </p>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

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
          <PasswordInput
            ref={passwordRef}
            label="Senha"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError("");
            }}
            error={passwordError}
          />
          {/* aria-disabled em vez de disabled: botão desativado perde o foco, e o
              leitor de tela ficaria sem saber onde está se der erro */}
          <Button type="submit" variant="primary" size="lg" block aria-disabled={submitting || undefined}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        {hasGoogle && (
          <>
            <p className={styles.or}>ou</p>
            <GoogleButton voltar={voltar} onStart={clearMessages} onError={setError} />
          </>
        )}
      </div>

      <section className={styles.other} aria-labelledby="sem-conta">
        <h2 id="sem-conta" className={styles.otherTitle}>
          Ainda não tem conta?
        </h2>
        <Button
          href={voltar ? routes.registerThenReturn(voltar) : routes.register}
          variant="soft"
          size="md"
          block
        >
          Criar conta
        </Button>
      </section>

      <p className={styles.text}>
        Saiba o que guardamos na{" "}
        <Link href={routes.privacy} className={styles.link}>
          política de privacidade
        </Link>
        .
      </p>
    </main>
  );
}

// useSearchParams exige Suspense no site estático
export default function EntrarPage() {
  return (
    <Suspense fallback={<EntrarLoading message="Carregando..." />}>
      <EntrarContent />
    </Suspense>
  );
}
