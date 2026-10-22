/**
 * Preferência dos atalhos de tecla única do estudo (Espaço, 1 e 2).
 *
 * Ficam DESLIGADOS por padrão: leitores de tela também usam teclas soltas (no
 * NVDA, o Espaço pode chegar à página durante a leitura e revelar a resposta
 * sem querer). A WCAG 2.1.4 exige que esse tipo de atalho possa ser desligado;
 * aqui a pessoa liga na Ajuda, e a escolha fica guardada neste aparelho.
 */
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cardvoz.atalhos";
const CHANGE_EVENT = "cardvoz:atalhos";

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "ligados";
  } catch {
    return false;
  }
}

export function setShortcutsEnabled(enabled: boolean) {
  try {
    if (enabled) localStorage.setItem(STORAGE_KEY, "ligados");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem armazenamento: a escolha não é lembrada, e os atalhos seguem desligados
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  // "storage" mantém outras abas em sincronia
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** true quando a pessoa ligou os atalhos na Ajuda. */
export function useShortcutsEnabled(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
