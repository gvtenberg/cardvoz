"use client";

import { useState } from "react";
import { Button } from "../Button";
import { isGoogleConfigured, startGoogleLogin } from "@/lib/auth/google";

export interface GoogleButtonProps {
  /** Página para onde voltar depois de entrar (caminho interno) */
  voltar: string | null;
  /** Chamado ao tocar, antes de sair para o Google (ex.: limpar mensagens da página) */
  onStart?: () => void;
  /** Chamado se o Google não abrir, com o texto para a página mostrar */
  onError: (message: string) => void;
}

/**
 * "Entrar com Google", usado em /entrar/ e /cadastro/. Não aparece quando o site
 * foi gerado sem NEXT_PUBLIC_GOOGLE_CLIENT_ID: o login com senha continua funcionando.
 */
export function GoogleButton({ voltar, onStart, onError }: GoogleButtonProps) {
  const [redirecting, setRedirecting] = useState(false);

  if (!isGoogleConfigured()) return null;

  const handleClick = () => {
    onStart?.();
    setRedirecting(true);
    startGoogleLogin(voltar).catch(() => {
      setRedirecting(false);
      onError("Não foi possível abrir o Google. Tente de novo.");
    });
  };

  return (
    <Button variant="secondary" size="lg" block onClick={handleClick} disabled={redirecting}>
      {redirecting ? "Abrindo o Google..." : "Entrar com Google"}
    </Button>
  );
}
