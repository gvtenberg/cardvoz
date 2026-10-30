"use client";

import { useEffect } from "react";
import { setInstallPrompt, type BeforeInstallPromptEvent } from "@/lib/install";

/**
 * Registra o service worker (gerado no build) para o CardVoz abrir sem
 * internet. Só em produção: no `npm run dev` não existe out/sw.js.
 */
export function ServiceWorkerRegister() {
  // Android: guarda a janela de instalação para o cartão "Instalar o CardVoz"
  // abrir na hora certa, em vez do aviso automático do navegador
  useEffect(() => {
    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sem service worker o site funciona igual, só não abre sem internet
      });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
