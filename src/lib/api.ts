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
}

export interface DeckDetailResponse extends DeckResponse {
  cards: CardResponse[];
}

export interface CardResponse {
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
}): Promise<DeckResponse> {
  return fetchApi<DeckResponse>("/decks", { method: "POST", body: JSON.stringify(data) });
}

/** Edição parcial: campos vazios são ignorados pela API (valide antes de enviar). */
export async function updateDeck(
  id: string,
  data: { title?: string; category?: string; description?: string }
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

export async function createCard(data: {
  deckId: string;
  question: string;
  answer: string;
  voiceNotes?: string;
  displayOrder?: number;
}): Promise<CardResponse> {
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

export async function startStudySession(data: {
  deckId?: string;
  deckSlug?: string;
}): Promise<StudySessionResponse> {
  return fetchApi<StudySessionResponse>("/study-sessions/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** Registra a resposta de uma ficha (a tela já calcula o placar sozinha). */
export async function recordStudyReview(
  sessionId: string,
  data: { cardId: string; wasCorrect: boolean; voiceUsed: boolean }
): Promise<void> {
  await fetchApi<StudyReviewResponse>(`/study-sessions/${sessionId}/review`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function finishStudySession(sessionId: string): Promise<StudySessionResponse> {
  return fetchApi<StudySessionResponse>(`/study-sessions/${sessionId}/finish`, { method: "POST" });
}

export async function getStudyHistory(deckId?: string): Promise<StudySessionResponse[]> {
  const query = deckId ? `?deckId=${deckId}` : "";
  return fetchApi<StudySessionResponse[]>(`/study-sessions/history${query}`);
}

/**
 * Cadastra várias fichas em sequência (importação de arquivo), preservando a ordem.
 * Retorna quantas fichas foram salvas; `onProgress` informa o avanço.
 * Para na hora se a sessão acabar ou a internet cair (as próximas falhariam igual).
 */
export async function createCards(
  deckId: string,
  cards: { question: string; answer: string }[],
  options?: { startOrder?: number; onProgress?: (done: number, total: number) => void }
): Promise<number> {
  const startOrder = options?.startOrder ?? 1;
  let saved = 0;
  for (let i = 0; i < cards.length; i++) {
    try {
      await createCard({
        deckId,
        question: cards[i].question,
        answer: cards[i].answer,
        displayOrder: startOrder + i,
      });
      saved++;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 0 || error.status === 401)) break;
      console.warn(`CardVoz: falha ao importar a ficha ${i + 1}:`, error);
    }
    options?.onProgress?.(i + 1, cards.length);
  }
  return saved;
}

// --- Rotas com menos chamadas (parte 4, na cardvoz-api) ----------------------
// Enquanto a API não as tiver, respondem 404/405 e o site usa o caminho antigo.

/** A rota ainda não existe na API publicada. */
export class RouteMissingError extends Error {
  constructor() {
    super("Rota ainda não disponível na API.");
    this.name = "RouteMissingError";
  }
}

// Lembra as rotas ausentes para não tentar de novo a cada chamada da mesma visita
const missingRoutes = new Set<string>();

async function fetchNewRoute<T>(route: string, endpoint: string, options?: RequestInit): Promise<T> {
  if (missingRoutes.has(route)) throw new RouteMissingError();
  try {
    return await fetchApi<T>(endpoint, options);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      missingRoutes.add(route);
      throw new RouteMissingError();
    }
    throw error;
  }
}

/** Cria o baralho com todas as fichas numa chamada só (tudo ou nada). */
export async function importDeck(data: {
  title: string;
  category: string;
  description?: string;
  cards: { question: string; answer: string }[];
}): Promise<DeckDetailResponse> {
  return fetchNewRoute("import", "/decks/import", { method: "POST", body: JSON.stringify(data) });
}

/** Baralhos criados ou alterados depois de `since`, já com as fichas. */
export async function getDeckChanges(
  since: string | null
): Promise<{ decks: DeckDetailResponse[]; allIds: string[]; serverTime: string }> {
  const query = since ? `?since=${encodeURIComponent(since)}` : "";
  const result = await fetchNewRoute<{ decks?: unknown; allIds?: unknown; serverTime?: unknown }>(
    "changes",
    `/decks/changes${query}`
  );
  // Na API sem a rota, um baralho com endereço "changes" responde aqui: não é a lista de alterações
  if (!Array.isArray(result?.decks) || !Array.isArray(result?.allIds) || typeof result?.serverTime !== "string") {
    throw new RouteMissingError();
  }
  return result as { decks: DeckDetailResponse[]; allIds: string[]; serverTime: string };
}

/**
 * Guarda uma sessão de estudo já concluída (feita com ou sem internet). Sem a
 * rota nova, a fila usa start + review + finish e guarda o progresso para
 * retomar a mesma sessão (ver lib/local/queue.ts).
 */
export async function completeStudySession(data: {
  deckId: string;
  startedAt: string;
  completedAt: string;
  answers: { cardId: string; wasCorrect: boolean; answeredAt: string }[];
}): Promise<void> {
  await fetchNewRoute("complete", "/study-sessions/complete", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
