/**
 * Leitura e gravação no localStorage do aparelho (baralhos, fila, conta...).
 *
 * Toda leitura passa por um validador: um dado corrompido ou de outra versão
 * não derruba a tela. O texto original vai para "<chave>.corrompido" (para dar
 * para recuperar à mão) e a leitura devolve o valor padrão.
 */

/** Aviso de "algo mudou" para a mesma aba; outras abas recebem o evento storage. */
const CHANGE_EVENT = "cardvoz:local";

export class StorageFullError extends Error {
  constructor() {
    super("O espaço do navegador acabou. Exporte seus baralhos e apague os que não usa.");
    this.name = "StorageFullError";
  }
}

export function readJson<T>(key: string, fallback: T, isValid: (v: unknown) => v is T): T {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    // Navegador bloqueando o armazenamento (modo restrito): segue sem dados
    return fallback;
  }
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (isValid(value)) return value;
  } catch {
    // cai no tratamento de corrompido abaixo
  }
  try {
    localStorage.setItem(`${key}.corrompido`, raw);
  } catch {}
  return fallback;
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function notify(key: string) {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: key }));
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (isQuotaError(error)) throw new StorageFullError();
    throw error;
  }
  notify(key);
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {}
  notify(key);
}

export function onLocalChange(listener: (key: string) => void): () => void {
  const onLocal = (event: Event) => listener(String((event as CustomEvent).detail));
  // Outra aba gravou (key null = storage limpo inteiro)
  const onStorage = (event: Event) => listener((event as StorageEvent).key ?? "");
  window.addEventListener(CHANGE_EVENT, onLocal);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onLocal);
    window.removeEventListener("storage", onStorage);
  };
}

let persistRequested = false;

/** Pede ao navegador para não apagar os dados sozinho quando faltar espaço. */
export function requestPersistentStorage(): void {
  if (persistRequested || typeof navigator === "undefined") return;
  persistRequested = true;
  navigator.storage?.persist?.().catch(() => {});
}
