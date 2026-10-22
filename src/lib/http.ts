/**
 * Base comum das chamadas à API C# (usada por api.ts e pela sessão de login).
 */

/**
 * Como o site é estático, o navegador chama a API direto. A URL é gravada no
 * build (NEXT_PUBLIC_API_URL) e a API precisa liberar o domínio do site no CORS
 * (variável CORS_ALLOWED_ORIGINS da cardvoz-api). Em produção use HTTPS.
 */
export function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") || "http://localhost:5000/api"
  );
}

/** Mensagem para quando a API nem respondeu (sem internet, API fora do ar). */
export const OFFLINE_MESSAGE =
  "Não foi possível falar com o CardVoz. Confira sua internet e tente de novo.";

/**
 * Erro de uma chamada à API, com o status HTTP (0 = sem resposta) e as
 * mensagens por campo dos erros 400 (chaves como a API manda: "Title", "Question"...).
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string[]> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const STATUS_MESSAGES: Record<number, string> = {
  401: "Sua sessão terminou. Entre de novo.",
  404: "Não encontramos o que você procurou.",
  429: "Muitas tentativas. Aguarde um minuto e tente de novo.",
};

/** Converte uma resposta de erro da API num ApiError com a mensagem dela. */
export async function toApiError(response: Response): Promise<ApiError> {
  let message = STATUS_MESSAGES[response.status] ?? "Algo deu errado no CardVoz. Tente de novo.";
  let fieldErrors: Record<string, string[]> = {};
  try {
    const body = await response.json();
    if (typeof body?.message === "string") message = body.message;
    if (body?.errors && typeof body.errors === "object") fieldErrors = body.errors;
  } catch {
    // Resposta sem corpo (ex.: 401 de token vencido)
  }
  return new ApiError(response.status, message, fieldErrors);
}

/** fetch que transforma falha de rede num ApiError com status 0. */
export async function safeFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError(0, OFFLINE_MESSAGE);
  }
}

/** Texto de erro para mostrar na tela: sem conexão tem mensagem própria. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && (error.status === 0 || error.status === 429)) {
    return error.message;
  }
  return fallback;
}
