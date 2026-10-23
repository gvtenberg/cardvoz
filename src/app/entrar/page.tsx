"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, LoadingStatus, Skeleton, useAuth } from "@/components";
import { ApiError } from "@/lib/http";
import { loginWithGoogleCode } from "@/lib/auth/session";
import {
  getGoogleClientId,
  getGoogleRedirectUri,
  readGoogleCallback,
  startGoogleLogin,
} from "@/lib/auth/google";
import { takeNotice } from "@/lib/notice";
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
          <Skeleton height="4.5rem" radius="9999px" />
          <Skeleton width="80%" height="1.125rem" />
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
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const handledRef = useRef(false);
  const isConfigured = Boolean(getGoogleClientId());

  useEffect(() => {
    // Roda uma vez só: o código do Google vale para uma única troca
    if (handledRef.current) return;
    handledRef.current = true;

    // Avisos de outra página ("Você saiu da sua conta."), preenchidos depois de
    // montar para o leitor de tela anunciar a mudança
    const pendingNotice = takeNotice();
    if (pendingNotice) setNotice(pendingNotice);

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

    loginWithGoogleCode({
      code: callback.code,
      codeVerifier: callback.verifier,
      redirectUri: getGoogleRedirectUri(),
    }).catch((err) => {
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

  const handleGoogle = () => {
    setError("");
    setNotice("");
    setRedirecting(true);
    startGoogleLogin(voltar).catch(() => {
      setRedirecting(false);
      setError("Não foi possível abrir o Google. Tente de novo.");
    });
  };

  if (exchanging || status === "logado") {
    return <EntrarLoading message="Entrando com o Google..." />;
  }
  if (status === "carregando") {
    return <EntrarLoading message="Verificando sua sessão..." />;
  }

  return (
    <main id="main-content" className={styles.main}>
      <div>
        <h1 className={styles.title}>Entrar no CardVoz</h1>
        <p className={styles.lead}>
          Use sua conta Google. Você não precisa criar uma senha.
        </p>
      </div>

      <p role="status" className={notice ? styles.notice : "sr-only"}>
        {notice}
      </p>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.panel}>
        {isConfigured ? (
          <Button variant="primary" size="lg" block onClick={handleGoogle} disabled={redirecting}>
            {redirecting ? "Abrindo o Google..." : "Entrar com Google"}
          </Button>
        ) : (
          <p role="alert" className={styles.error}>
            O login com Google ainda não foi configurado neste site.
          </p>
        )}

        <p className={styles.text}>
          Na primeira vez, sua conta no CardVoz é criada sozinha. Recebemos só o seu
          nome e o seu e-mail do Google. Veja a{" "}
          <Link href={routes.privacy} className={styles.link}>
            política de privacidade
          </Link>
          .
        </p>
      </div>
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
