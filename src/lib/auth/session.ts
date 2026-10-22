/**
 * Sessão de login: guarda os tokens, renova sozinha e avisa quem estiver
 * ouvindo (o AuthProvider) quando a pessoa entra ou sai.
 *
 * - accessToken: só em memória. Dá acesso aos dados e dura 15 minutos; fora do
 *   localStorage, um script malicioso tem menos chance de copiá-lo.
 * - refreshToken: no localStorage, para a pessoa continuar logada ao fechar o
 *   navegador. Sozinho ele não abre os dados (só gera um novo accessToken), e a
 *   rotação com detecção de roubo da API limita o estrago se vazar.
 *
 * Cookie httpOnly seria o ideal, mas site e API ficam em domínios diferentes
 * do onrender.com, e navegadores bloqueiam cookies entre sites.
 */
import { ApiError, getApiBaseUrl, safeFetch, toApiError } from "@/lib/http";

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  user: UserResponse;
}

/** Por que a sessão acabou: a pessoa saiu ou a sessão venceu/foi encerrada. */
export type SessionEndReason = "logout" | "expired";

type SessionListener = (user: UserResponse | null, reason?: SessionEndReason) => void;

export const REFRESH_TOKEN_KEY = "cardvoz.refreshToken";

let accessToken: string | null = null;
const listeners = new Set<SessionListener>();

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null; // modo privado ou armazenamento bloqueado
  }
}

/** Avisa quando a pessoa entra (user) ou sai (null + motivo). Devolve a função para parar. */
export function onSessionChange(listener: SessionListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveSession(auth: AuthResponse) {
  accessToken = auth.accessToken;
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, auth.refreshToken);
  } catch {
    // Sem armazenamento: a sessão dura só enquanto a aba estiver aberta
  }
  listeners.forEach((listener) => listener(auth.user));
}

export function clearSession(reason: SessionEndReason) {
  accessToken = null;
  try {
    // Remover a chave avisa as outras abas (evento "storage")
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}
  listeners.forEach((listener) => listener(null, reason));
}

/** Esquece a sessão desta aba sem mexer no localStorage (outra aba já saiu). */
export function forgetSession(reason: SessionEndReason) {
  accessToken = null;
  listeners.forEach((listener) => listener(null, reason));
}

let refreshing: Promise<AuthResponse | null> | null = null;

/**
 * Renova a sessão. Chamadas simultâneas (e outras abas) esperam a mesma renovação:
 * usar o mesmo refreshToken duas vezes faz a API achar que ele foi roubado e
 * encerrar todas as sessões da pessoa.
 *
 * Devolve null se não houver sessão ou se ela venceu (e limpa a sessão).
 * Lança ApiError se a API não respondeu: sem internet não é motivo para deslogar.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  return (refreshing ??= (async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.locks) {
        // A trava "cardvoz-refresh" vale para todas as abas do site
        return await navigator.locks.request("cardvoz-refresh", renew);
      }
      return await renew();
    } finally {
      refreshing = null;
    }
  })());
}

async function renew(): Promise<AuthResponse | null> {
  // Lê o token DENTRO da trava: se outra aba renovou enquanto esperávamos,
  // usamos o token novo dela, e não o antigo (que já foi invalidado).
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await safeFetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (response.status === 401 || response.status === 400) {
    clearSession("expired");
    return null;
  }
  if (!response.ok) {
    throw await toApiError(response);
  }

  const auth: AuthResponse = await response.json();
  saveSession(auth);
  return auth;
}

/** Entra com o código que o Google devolveu (ver lib/auth/google.ts). */
export async function loginWithGoogleCode(data: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<AuthResponse> {
  const response = await safeFetch(`${getApiBaseUrl()}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw await toApiError(response);
  }

  const auth: AuthResponse = await response.json();
  saveSession(auth);
  return auth;
}

/**
 * Sai da conta: limpa a sessão local na hora (a pessoa pediu para sair, mesmo
 * sem internet) e avisa a API para invalidar o refreshToken. Só apagar no
 * navegador não basta: uma cópia do token ainda valeria por 30 dias.
 */
export function logout() {
  const refreshToken = getRefreshToken();
  clearSession("logout");
  if (!refreshToken) return;

  fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    // Continua mesmo se a página mudar logo em seguida
    keepalive: true,
  }).catch(() => {
    // Sem internet: o token vence sozinho em até 30 dias
  });
}

export { ApiError };
