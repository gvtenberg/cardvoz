/**
 * Sugestão de instalar o CardVoz na tela inicial. O cartão nunca abre sozinho
 * como diálogo: aparece na lista de baralhos depois do primeiro estudo, e some
 * por 7 dias ("Agora não") ou de vez ("Não mostrar mais").
 */
import { useEffect, useState } from "react";
import { readJson, writeJson } from "@/lib/local/storage";

export const INSTALL_KEY = "cardvoz.instalar.v1";
export const FIRST_STUDY_KEY = "cardvoz.primeiroEstudo.v1";
export const SNOOZE_DAYS = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

interface InstallPrefs {
  hiddenUntil?: number;
  never?: boolean;
}

export type Platform = "android" | "ios" | "outro";

/** Evento do Chrome (Android) que permite abrir a janela de instalação depois. */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isPrefs = (v: unknown): v is InstallPrefs => typeof v === "object" && v !== null;
const isTrue = (v: unknown): v is boolean => v === true;

function readPrefs(): InstallPrefs {
  return readJson<InstallPrefs>(INSTALL_KEY, {}, isPrefs);
}

export function markFirstStudyDone(): void {
  try {
    writeJson(FIRST_STUDY_KEY, true);
  } catch {}
}

export function snoozeInstall(now: number): void {
  writeJson(INSTALL_KEY, { ...readPrefs(), hiddenUntil: now + SNOOZE_DAYS * DAY_MS });
}

export function neverShowInstall(): void {
  writeJson(INSTALL_KEY, { ...readPrefs(), never: true });
}

export function shouldShowInstallCard(env: {
  now: number;
  standalone: boolean;
  platform: Platform;
  hasPrompt: boolean;
}): boolean {
  if (!readJson<boolean>(FIRST_STUDY_KEY, false, isTrue) || env.standalone) return false;
  const prefs = readPrefs();
  if (prefs.never || env.now < (prefs.hiddenUntil ?? 0)) return false;
  return (env.platform === "android" && env.hasPrompt) || env.platform === "ios";
}

/** iPadOS se apresenta como Mac; o toque denuncia que é um iPad. */
export function detectPlatform(userAgent: string, maxTouchPoints: number): Platform {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Macintosh/.test(userAgent) && maxTouchPoints > 1) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return "outro";
}

// --- Janela de instalação do Android -----------------------------------------

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<() => void>();

export function setInstallPrompt(event: BeforeInstallPromptEvent | null): void {
  deferredPrompt = event;
  promptListeners.forEach((listener) => listener());
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useInstallPrompt(): {
  prompt: (() => Promise<void>) | null;
  platform: Platform;
  standalone: boolean;
} {
  const [, setTick] = useState(0);
  const [env, setEnv] = useState<{ platform: Platform; standalone: boolean }>({
    platform: "outro",
    standalone: true,
  });

  useEffect(() => {
    // Só no navegador (o build estático não tem navigator)
    setEnv({
      platform: detectPlatform(navigator.userAgent, navigator.maxTouchPoints ?? 0),
      standalone: isStandalone(),
    });
    const listener = () => setTick((n) => n + 1);
    promptListeners.add(listener);
    return () => {
      promptListeners.delete(listener);
    };
  }, []);

  const prompt = deferredPrompt
    ? async () => {
        const event = deferredPrompt as BeforeInstallPromptEvent;
        await event.prompt();
        await event.userChoice.catch(() => undefined);
        // A janela só pode ser usada uma vez
        setInstallPrompt(null);
      }
    : null;

  return { prompt, ...env };
}
