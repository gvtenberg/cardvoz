/**
 * CardVoz - Cliente da API C# (.NET 9)
 *
 * Funções tipadas para baralhos, fichas e sessões de estudo. Toda chamada leva
 * o token de login; se ele vencer (401), a sessão é renovada uma vez e a
 * chamada é repetida. Erros viram ApiError: nada é "salvo" só no navegador,
 * então a tela sempre sabe quando algo falhou.
 */
import { ApiError, getApiBaseUrl, safeFetch, toApiError } from "@/lib/http";
import { getAccessToken, refreshSession } from "@/lib/auth/session";
import type { CardStats } from "@/lib/studyStats";

export { ApiError, errorMessage } from "@/lib/http";

export interface DeckResponse {
  id: string;
  slug: string;
  title: string;
  category: string;
  description?: string | null;
  cardCount: number;
  createdAt: string;
  updatedAt?: string | null;
  /** Baralho compartilhado de onde esta cópia veio (null se não for cópia) */
  sourceDeckId?: string | null;
  /** Última vez que o baralho foi estudado (estudar não muda o updatedAt) */
  lastStudiedAt?: string | null;
  /** Idioma das perguntas e das respostas (ex.: "en"); ausente = português ou API sem o campo */
  questionLanguage?: string | null;
  answerLanguage?: string | null;
}

/** Idiomas para a API: "" volta para português (null não muda nada no PUT). */
export type DeckLanguagesInput = { questionLanguage?: string; answerLanguage?: string };

export interface DeckDetailResponse extends DeckResponse {
  cards: CardResponse[];
}

/** Acertos e erros vêm junto (API com a migration de estatísticas; antes, ausentes). */
export interface CardResponse extends CardStats {
  id: string;
  deckId: string;
  question: string;
  answer: string;
  voiceNotes?: string | null;
  displayOrder: number;
  createdAt: string;
}

export interface StudySessionResponse {
  id: string;
  deckId: string;
  deckTitle?: string | null;
  deckSlug?: string | null;
  startedAt: string;
  completedAt?: string | null;
  totalCards: number;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  isCompleted?: boolean;
  reviews?: StudyReviewResponse[];
}

export interface StudyReviewResponse {
  id: string;
  studySessionId: string;
  cardId: string;
  wasCorrect: boolean;
  voiceUsed: boolean;
  answeredAt: string;
}

/**
 * Chamada autenticada à API. Só manda Content-Type quando há corpo: em GET ele
 * é desnecessário (o Authorization já exige a pergunta prévia de CORS, que a
 * API deixa o navegador guardar por 2 horas).
 */
async function fetchApi<T>(endpoint: string, options: RequestInit = {}, canRetry = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await safeFetch(`${getApiBaseUrl()}${endpoint}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  // Token vencido: renova uma vez e repete. Se a sessão acabou, o AuthProvider
  // fica sabendo pela própria renovação e leva a pessoa para /entrar/.
  if (response.status === 401 && canRetry) {
    const renewed = await refreshSession();
    if (renewed) return fetchApi<T>(endpoint, options, false);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

/** Lista os baralhos da pessoa logada. */
export async function getDecks(category?: string, search?: string): Promise<DeckResponse[]> {
  const params = new URLSearchParams();
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  const query = params.toString() ? `?${params}` : "";
  return fetchApi<DeckResponse[]>(`/decks${query}`);
}

/** Detalhe de um baralho por ID ou slug. Devolve null se não existir (ou não for seu). */
export async function getDeck(idOrSlug: string): Promise<DeckDetailResponse | null> {
  try {
    return await fetchApi<DeckDetailResponse>(`/decks/${encodeURIComponent(idOrSlug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function createDeck(data: {
  title: string;
  category: string;
  description?: string;
} & DeckLanguagesInput): Promise<DeckResponse> {
  return fetchApi<DeckResponse>("/decks", { method: "POST", body: JSON.stringify(data) });
}

/** Edição parcial: campos vazios são ignorados pela API (valide antes de enviar). */
export async function updateDeck(
  id: string,
  data: { title?: string; category?: string; description?: string } & DeckLanguagesInput
): Promise<DeckResponse> {
  return fetchApi<DeckResponse>(`/decks/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

/** Exclui o baralho com as fichas e sessões dele. */
export async function deleteDeck(id: string): Promise<void> {
  await fetchApi<void>(`/decks/${id}`, { method: "DELETE" });
}

/** Baralhos compartilhados, criados pela equipe no painel de admin. */
export async function getSharedDecks(): Promise<DeckResponse[]> {
  return fetchApi<DeckResponse[]>("/shared-decks");
}

/** Adiciona uma cópia do baralho compartilhado, com as fichas, aos baralhos da pessoa. */
export async function copySharedDeck(id: string): Promise<DeckResponse> {
  return fetchApi<DeckResponse>(`/shared-decks/${id}/copy`, { method: "POST" });
}

export async function getCategories(): Promise<string[]> {
  return fetchApi<string[]>("/decks/categories");
}

export async function getCards(deckId: string): Promise<CardResponse[]> {
  return fetchApi<CardResponse[]>(`/decks/${deckId}/cards`);
}

/** Os acertos e erros só vão ao levar para a conta uma ficha estudada sem login. */
export async function createCard(data: {
  deckId: string;
  question: string;
  answer: string;
  voiceNotes?: string;
  displayOrder?: number;
} & CardStats): Promise<CardResponse> {
  return fetchApi<CardResponse>("/cards", { method: "POST", body: JSON.stringify(data) });
}

/** Edição parcial: campos vazios são ignorados pela API (valide antes de enviar). */
export async function updateCard(
  id: string,
  data: { question?: string; answer?: string; voiceNotes?: string; displayOrder?: number }
): Promise<CardResponse> {
  return fetchApi<CardResponse>(`/cards/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteCard(id: string): Promise<void> {
  await fetchApi<void>(`/cards/${id}`, { method: "DELETE" });
}

export async function getStudyHistory(deckId?: string): Promise<StudySessionResponse[]> {
  const query = deckId ? `?deckId=${deckId}` : "";
  return fetchApi<StudySessionResponse[]>(`/study-sessions/history${query}`);
}

// --- Dados da conta (LGPD) ---------------------------------------------------

/** Manda de novo o link de confirmação do e-mail. Devolve a mensagem da API. */
export async function resendEmailConfirmation(): Promise<string> {
  const body = await fetchApi<{ message?: string }>("/auth/resend-confirmation", { method: "POST" });
  return body?.message ?? "Enviamos o link de confirmação para o seu e-mail.";
}

/** Tudo o que a conta guarda, para baixar em JSON. */
export async function exportAccount(): Promise<unknown> {
  return fetchApi<unknown>("/account/export");
}

/** Exclui a conta com tudo o que ela guarda. Erros de campo: ConfirmEmail e Password. */
export async function deleteAccount(data: { confirmEmail: string; password?: string }): Promise<void> {
  await fetchApi<void>("/account/delete", { method: "POST", body: JSON.stringify(data) });
}

// --- Rotas com menos chamadas (parte 4) -------------------------------------

/**
 * Cria o baralho com todas as fichas numa chamada só (tudo ou nada). Com `id`
 * (gerado no aparelho), o mesmo pedido repetido devolve o baralho já criado.
 */
export async function importDeck(data: {
  id?: string;
  title: string;
  category: string;
  description?: string;
  cards: ({ question: string; answer: string } & CardStats)[];
} & DeckLanguagesInput): Promise<DeckDetailResponse> {
  return fetchApi<DeckDetailResponse>("/decks/import", { method: "POST", body: JSON.stringify(data) });
}

/** Baralhos criados ou alterados depois de `since`, já com as fichas. */
export async function getDeckChanges(
  since: string | null
): Promise<{ decks: DeckDetailResponse[]; allIds: string[]; serverTime: string }> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  return fetchApi<{ decks: DeckDetailResponse[]; allIds: string[]; serverTime: string }>(`/decks/changes${query}`);
}

/**
 * Guarda uma sessão de estudo já concluída (feita com ou sem internet), com
 * todas as respostas numa chamada só.
 */
export async function completeStudySession(data: {
  /** Gerado no aparelho: o mesmo pedido repetido não duplica a sessão nem os acertos */
  id?: string;
  deckId: string;
  startedAt: string;
  completedAt: string;
  answers: { cardId: string; wasCorrect: boolean; answeredAt: string }[];
}): Promise<void> {
  await fetchApi<void>("/study-sessions/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
