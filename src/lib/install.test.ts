import { describe, expect, it } from "vitest";
import {
  detectPlatform,
  markFirstStudyDone,
  neverShowInstall,
  shouldShowInstallCard,
  snoozeInstall,
} from "./install";

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 30);
const android = { now: NOW, standalone: false, platform: "android" as const, hasPrompt: true };

describe("cartão de instalar", () => {
  it("só aparece depois do primeiro estudo", () => {
    expect(shouldShowInstallCard(android)).toBe(false);
    markFirstStudyDone();
    expect(shouldShowInstallCard(android)).toBe(true);
  });

  it("não aparece quando o app já foi aberto pelo ícone", () => {
    markFirstStudyDone();
    expect(shouldShowInstallCard({ ...android, standalone: true })).toBe(false);
  });

  it("no Android precisa da janela de instalação; no iPhone mostra o passo a passo; no computador não", () => {
    markFirstStudyDone();
    expect(shouldShowInstallCard({ ...android, hasPrompt: false })).toBe(false);
    expect(shouldShowInstallCard({ ...android, platform: "ios", hasPrompt: false })).toBe(true);
    expect(shouldShowInstallCard({ ...android, platform: "outro" })).toBe(false);
  });

  it("'Agora não' esconde por 7 dias", () => {
    markFirstStudyDone();
    snoozeInstall(NOW);
    expect(shouldShowInstallCard({ ...android, now: NOW + 7 * DAY - 1 })).toBe(false);
    expect(shouldShowInstallCard({ ...android, now: NOW + 7 * DAY })).toBe(true);
  });

  it("'Não mostrar mais' esconde de vez", () => {
    markFirstStudyDone();
    neverShowInstall();
    expect(shouldShowInstallCard({ ...android, now: NOW + 365 * DAY })).toBe(false);
  });

  it("reconhece o aparelho pelo navegador", () => {
    expect(detectPlatform("Mozilla/5.0 (Linux; Android 14; SM-A145M) Chrome/130", 5)).toBe("android");
    expect(detectPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)", 5)).toBe("ios");
    expect(detectPlatform("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari", 5)).toBe("ios");
    expect(detectPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130", 0)).toBe("outro");
  });
});

describe("janela de instalação antes da página carregar", () => {
  it("usa o evento guardado pelo script do início da página", async () => {
    const { takeEarlyPrompt } = await import("./install");
    const event = { prompt: async () => {} };
    (window as unknown as { __cardvozInstallPrompt?: unknown }).__cardvozInstallPrompt = event;
    expect(takeEarlyPrompt()).toBe(event);
    expect(takeEarlyPrompt()).toBeNull();
  });
});
