"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (gerado no build) para o CardVoz abrir sem
 * internet. Só em produção: no `npm run dev` não existe out/sw.js.
 */
export function ServiceWorkerRegister() {
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
