/**
 * Conta ativa guardada no aparelho (sem token). Serve para saber, mesmo sem
 * internet, de quem são as cópias e a fila de alterações.
 */
import { readJson, removeKey, writeJson } from "./storage";

export interface SavedAccount {
  id: string;
  name: string;
  email: string;
  /** serverTime da última atualização das cópias (rota de alterações da API) */
  lastSync?: string | null;
}

export const ACCOUNT_KEY = "cardvoz.conta.v1";

const isAccount = (v: unknown): v is SavedAccount =>
  typeof v === "object" && v !== null && typeof (v as SavedAccount).id === "string";

export function getSavedAccount(): SavedAccount | null {
  return readJson<SavedAccount | null>(ACCOUNT_KEY, null, isAccount);
}

export function saveAccount(account: SavedAccount): void {
  const current = getSavedAccount();
  // Mantém o lastSync só se for a mesma conta
  const lastSync = current?.id === account.id ? (account.lastSync ?? current.lastSync ?? null) : (account.lastSync ?? null);
  writeJson(ACCOUNT_KEY, { id: account.id, name: account.name, email: account.email, lastSync });
}

export function clearSavedAccount(): void {
  removeKey(ACCOUNT_KEY);
}
