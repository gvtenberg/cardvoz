/**
 * Login com Google pelo fluxo "authorization code + PKCE", com redirecionamento.
 *
 * Usamos nosso próprio botão e a página inteira do Google, e não o botão oficial
 * (iframe que não controlamos) nem o One Tap (janela que abre sozinha e
 * atrapalha o leitor de tela).
 *
 * 1. startGoogleLogin: gera `state` e o verificador PKCE, guarda na aba e vai ao Google.
 * 2. O Google volta para /entrar/?code=...&state=...
 * 3. readGoogleCallback confere o `state` e devolve o código e o verificador,
 *    que vão para a API (POST /api/auth/google). O segredo do cliente fica só na API.
 */
import { routes } from "@/lib/routes";

const PENDING_KEY = "cardvoz.googleLogin";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

interface PendingLogin {
  state: string;
  verifier: string;
  /** Página para onde voltar depois de entrar */
  voltar: string | null;
}

export function getGoogleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
}

/** O site foi gerado com o ID do cliente do Google? Sem ele, só há login com senha. */
export function isGoogleConfigured(): boolean {
  return Boolean(getGoogleClientId());
}

/** Endereço de volta do Google. Precisa estar cadastrado no Google Cloud, igual. */
export function getGoogleRedirectUri(): string {
  return `${window.location.origin}${routes.login}`;
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomString(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function startGoogleLogin(voltar: string | null) {
  const pending: PendingLogin = { state: randomString(), verifier: randomString(), voltar };
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pending.verifier));

  // sessionStorage: vale só nesta aba e some ao fechá-la
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));

  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: pending.state,
    code_challenge: base64Url(new Uint8Array(digest)),
    code_challenge_method: "S256",
    // Sempre mostra a escolha de conta: em aparelho compartilhado, evita entrar na conta errada
    prompt: "select_account",
    hl: "pt-BR",
  });
  window.location.assign(`${AUTH_ENDPOINT}?${params}`);
}

export type GoogleCallback =
  | { kind: "ok"; code: string; verifier: string; voltar: string | null }
  | { kind: "error"; message: string; voltar: string | null };

/** Lê e consome o pedido guardado antes de ir ao Google. */
function takePending(): PendingLogin | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as PendingLogin) : null;
  } catch {
    return null;
  }
}

/** Interpreta a volta do Google (parâmetros code/state/error de /entrar/). */
export function readGoogleCallback(params: URLSearchParams): GoogleCallback | null {
  const code = params.get("code");
  const error = params.get("error");
  if (!code && !error) return null;

  const pending = takePending();
  const voltar = pending?.voltar ?? null;

  if (error) {
    return {
      kind: "error",
      voltar,
      message:
        error === "access_denied"
          ? "A entrada com o Google foi cancelada. Toque em Entrar com Google para tentar de novo."
          : "O Google não concluiu a entrada. Tente de novo.",
    };
  }

  // O state impede que alguém faça você entrar na conta dele com um link preparado
  if (!pending || pending.state !== params.get("state")) {
    return {
      kind: "error",
      voltar,
      message: "Não foi possível confirmar a entrada. Tente de novo.",
    };
  }

  return { kind: "ok", code: code!, verifier: pending.verifier, voltar };
}
