"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../AuthProvider";
import { Button } from "../Button";
import { LoadingStatus, Skeleton } from "../Skeleton";
import { PUBLIC_PATHS, routes, samePath } from "@/lib/routes";
import styles from "./AuthGate.module.scss";

/**
 * Protege as páginas que pedem login, num lugar só (página nova já nasce protegida).
 * É só experiência de uso: quem protege os dados de verdade é a API, que não
 * entrega nada sem token.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, endReason, restoreError, retry } = useAuth();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.some((path) => samePath(path, pathname));

  useEffect(() => {
    if (isPublic || status !== "deslogado") return;
    // Quem saiu por conta própria vai para a tela de entrar; quem perdeu a sessão
    // volta para a mesma página depois de entrar de novo.
    const here = window.location.pathname + window.location.search;
    router.replace(endReason === "logout" ? routes.login : routes.loginThenReturn(here));
  }, [isPublic, status, endReason, router, pathname]);

  if (isPublic || status === "logado") {
    return <>{children}</>;
  }

  if (status === "erro") {
    return (
      <main id="main-content" className={styles.main}>
        <div className={styles.panel}>
          <h1 className={styles.title}>Não foi possível abrir sua conta</h1>
          <p role="alert" className={styles.text}>
            {restoreError}
          </p>
          <Button variant="primary" size="lg" block onClick={retry}>
            Tentar de novo
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.main}>
      <LoadingStatus>Verificando sua sessão...</LoadingStatus>
      <div className={styles.skeleton} aria-hidden="true">
        <Skeleton width="60%" height="2.5rem" />
        <div className={styles.panel}>
          <Skeleton width="80%" height="1.25rem" />
          <Skeleton width="55%" height="1.25rem" />
          <Skeleton height="4.5rem" radius="9999px" />
        </div>
      </div>
    </main>
  );
}
