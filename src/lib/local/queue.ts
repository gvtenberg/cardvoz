/**
 * Fila de alterações dos baralhos da conta. A tela muda na hora (no aparelho)
 * e a alteração espera aqui até haver internet. O envio é em ordem, um item por
 * vez, e cada item sai da fila assim que a API confirma: fechar o app no meio
 * não repete o que já foi.
 *
 * Se o mesmo baralho for editado em dois aparelhos, vale a última alteração
 * enviada (decisão do grupo; sincronização completa fica para o futuro).
 */
import { ApiError, type CardResponse, type DeckDetailResponse } from "@/lib/api";
import { statsPayload, type CardStats } from "@/lib/studyStats";
import { findLocalDeck, listLocalDecks, updateLocalDeck } from "./decks";
import { readJson, removeKey, writeJson } from "./storage";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type QueueItem = { id: string; createdAt: string } & (
  | {
      type: "criarBaralho";
      deckId: string;
      title: string;
      category: string;
      /** Fichas importadas de um arquivo exportado trazem o histórico (CardStats) */
      cards: ({ localId: string; question: string; answer: string } & CardStats)[];
      /** Idioma escolhido antes de o baralho chegar à conta (null = português) */
      questionLang?: string | null;
      answerLang?: string | null;
    }
  | { type: "idiomaBaralho"; deckId: string; questionLang: string | null; answerLang: string | null }
  | { type: "renomearBaralho"; deckId: string; title: string }
  | { type: "excluirBaralho"; deckId: string }
  | {
      type: "criarFicha"; deckId: string; localId: string; question: string; answer: string; displayOrder: number;
      /** Histórico importado de um arquivo (só na criação: o estudo depois vai como item próprio) */
      stats?: CardStats;
    }
  | { type: "editarFicha"; deckId: string; cardId: string; question: string; answer: string }
  | { type: "excluirFicha"; deckId: string; cardId: string }
  | {
      type: "estudo";
      deckId: string;
      startedAt: string;
      completedAt: string;
      answers: { cardId: string; wasCorrect: boolean; answeredAt: string }[];
    }
);

export type NewQueueItem = DistributiveOmit<QueueItem, "id" | "createdAt">;

export const QUEUE_KEY = "cardvoz.fila.v1";

interface StoredQueue {
  userId: string;
  items: QueueItem[];
}

const isQueue = (v: unknown): v is StoredQueue =>
  typeof v === "object" && v !== null &&
  typeof (v as StoredQueue).userId === "string" && Array.isArray((v as StoredQueue).items);

export function readQueue(userId: string): QueueItem[] {
  const stored = readJson<StoredQueue | null>(QUEUE_KEY, null, isQueue);
  return stored && stored.userId === userId ? stored.items : [];
}

function writeQueue(userId: string, items: QueueItem[]) {
  writeJson(QUEUE_KEY, { userId, items });
}

export function pendingCount(userId: string): number {
  return readQueue(userId).length;
}

export function hasPendingFor(userId: string, deckId: string): boolean {
  return readQueue(userId).some((item) => item.deckId === deckId);
}

/** Como hasPendingFor, sem contar estudos (estudar não muda o baralho). */
export function hasEditsPendingFor(userId: string, deckId: string): boolean {
  return readQueue(userId).some((item) => item.deckId === deckId && item.type !== "estudo");
}

export function clearQueue(): void {
  removeKey(QUEUE_KEY);
}

/** Junta a alteração com o que ainda não foi enviado, para não mandar o que se anula. */
export function enqueue(userId: string, item: NewQueueItem): void {
  // Fila de outra conta não deveria existir (sair limpa); por garantia, é descartada
  let items = readQueue(userId);
  const full = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() } as QueueItem;

  const pendingDeck = items.find(
    (i): i is Extract<QueueItem, { type: "criarBaralho" }> =>
      i.type === "criarBaralho" && i.deckId === item.deckId
  );

  switch (item.type) {
    case "excluirBaralho":
      if (pendingDeck) {
        writeQueue(userId, items.filter((i) => i.deckId !== item.deckId));
        return;
      }
      // Alterações de um baralho que vai ser excluído não precisam ir
      items = items.filter((i) => i.deckId !== item.deckId);
      break;

    case "renomearBaralho":
      if (pendingDeck) {
        pendingDeck.title = item.title;
        writeQueue(userId, items);
        return;
      }
      break;

    case "idiomaBaralho":
      if (pendingDeck) {
        pendingDeck.questionLang = item.questionLang;
        pendingDeck.answerLang = item.answerLang;
        writeQueue(userId, items);
        return;
      }
      // Só a escolha mais nova precisa ir
      items = items.filter((i) => !(i.type === "idiomaBaralho" && i.deckId === item.deckId));
      break;

    case "criarFicha":
      if (pendingDeck) {
        pendingDeck.cards.push({ localId: item.localId, question: item.question, answer: item.answer });
        writeQueue(userId, items);
        return;
      }
      break;

    case "editarFicha": {
      const inDeck = pendingDeck?.cards.find((c) => c.localId === item.cardId);
      if (inDeck) {
        inDeck.question = item.question;
        inDeck.answer = item.answer;
        writeQueue(userId, items);
        return;
      }
      const created = items.find((i) => i.type === "criarFicha" && i.localId === item.cardId);
      if (created && created.type === "criarFicha") {
        created.question = item.question;
        created.answer = item.answer;
        writeQueue(userId, items);
        return;
      }
      break;
    }

    case "excluirFicha": {
      if (pendingDeck?.cards.some((c) => c.localId === item.cardId)) {
        pendingDeck.cards = pendingDeck.cards.filter((c) => c.localId !== item.cardId);
        writeQueue(userId, items);
        return;
      }
      const created = items.some((i) => i.type === "criarFicha" && i.localId === item.cardId);
      if (created) {
        writeQueue(
          userId,
          items.filter(
            (i) =>
              !(i.type === "criarFicha" && i.localId === item.cardId) &&
              !(i.type === "editarFicha" && i.cardId === item.cardId)
          )
        );
        return;
      }
      break;
    }
  }

  writeQueue(userId, [...items, full]);
}

export type QueueApi = Pick<
  typeof import("@/lib/api"),
  | "importDeck" | "updateDeck" | "deleteDeck" | "createCard" | "updateCard" | "deleteCard"
  | "completeStudySession"
>;

export interface QueueResult {
  sent: number;
  failures: string[];
  stoppedOffline: boolean;
  stoppedSession: boolean;
}

function shortText(text: string): string {
  return text.length > 60 ? `${text.slice(0, 57).trimEnd()}...` : text;
}

function deckTitle(deckId: string): string {
  return findLocalDeck(deckId)?.title ?? "um baralho";
}

function cardQuestion(deckId: string, cardId: string, fallback?: string): string {
  const card = findLocalDeck(deckId)?.cards.find((c) => c.id === cardId);
  return shortText(card?.question ?? fallback ?? "sem título");
}

/** Troca ids locais pelos da API nos próximos itens da fila e no baralho guardado. */
function applyIds(userId: string, oldDeckId: string, newDeck: DeckDetailResponse | null, cardIds: Map<string, string>) {
  const newDeckId = newDeck?.id ?? oldDeckId;
  const items = readQueue(userId).map((i) => {
    const next = { ...i } as QueueItem;
    if (next.deckId === oldDeckId) next.deckId = newDeckId;
    if ((next.type === "editarFicha" || next.type === "excluirFicha") && cardIds.has(next.cardId)) {
      next.cardId = cardIds.get(next.cardId) as string;
    }
    if (next.type === "estudo") {
      next.answers = next.answers.map((a) => ({ ...a, cardId: cardIds.get(a.cardId) ?? a.cardId }));
    }
    return next;
  });
  writeQueue(userId, items);

  updateLocalDeck(oldDeckId, (deck) => ({
    ...deck,
    id: newDeckId,
    aliases: newDeckId !== deck.id ? [...deck.aliases, deck.id] : deck.aliases,
    account: {
      userId,
      remoteId: newDeckId,
      remoteUpdatedAt: newDeck?.updatedAt ?? deck.account?.remoteUpdatedAt ?? null,
    },
    cards: deck.cards.map((c) => {
      const next = cardIds.get(c.id);
      return next ? { ...c, id: next, aliases: [...(c.aliases ?? []), c.id] } : c;
    }),
  }));
}

function removeFirst(userId: string, id: string) {
  writeQueue(userId, readQueue(userId).filter((i) => i.id !== id));
}


/** Idioma para criar na API: só o que não é português (ausente = português). */
export function languagesInput(questionLang?: string | null, answerLang?: string | null) {
  return {
    ...(questionLang ? { questionLanguage: questionLang } : {}),
    ...(answerLang ? { answerLanguage: answerLang } : {}),
  };
}

/** Envia um item. Devolve uma frase de falha quando ele não pôde ser aplicado. */
async function sendItem(userId: string, item: QueueItem, api: QueueApi): Promise<string | null> {
  switch (item.type) {
    case "criarBaralho": {
      // O id do aparelho vira o da conta: se a resposta se perder, repetir o pedido
      // devolve o baralho já criado (200), sem duplicar. As fichas só levam o histórico
      // importado de arquivo: o estudo depois da criação vai como item próprio
      const created = await api.importDeck({
        id: item.deckId,
        title: item.title,
        category: item.category,
        ...languagesInput(item.questionLang, item.answerLang),
        cards: item.cards.map((c) => ({ question: c.question, answer: c.answer, ...statsPayload(c) })),
      });
      const ordered = [...created.cards].sort((a, b) => a.displayOrder - b.displayOrder);
      const ids = new Map(item.cards.map((c, i) => [c.localId, ordered[i]?.id ?? c.localId]));
      applyIds(userId, item.deckId, created, ids);
      removeFirst(userId, item.id);
      return null;
    }
    case "criarFicha": {
      const card: CardResponse = await api.createCard({
        deckId: item.deckId,
        question: item.question,
        answer: item.answer,
        displayOrder: item.displayOrder,
        ...item.stats,
      });
      applyIds(userId, item.deckId, null, new Map([[item.localId, card.id]]));
      removeFirst(userId, item.id);
      return null;
    }
    case "renomearBaralho":
      await api.updateDeck(item.deckId, { title: item.title });
      break;
    case "excluirBaralho":
      await api.deleteDeck(item.deckId);
      break;
    case "idiomaBaralho":
      await api.updateDeck(item.deckId, {
        questionLanguage: item.questionLang ?? "",
        answerLanguage: item.answerLang ?? "",
      });
      break;
    case "editarFicha":
      await api.updateCard(item.cardId, { question: item.question, answer: item.answer });
      break;
    case "excluirFicha":
      await api.deleteCard(item.cardId);
      break;
    case "estudo":
      await sendStudy(item, api);
      break;
  }
  removeFirst(userId, item.id);
  return null;
}

function failureFor(item: QueueItem, status: number): string | null {
  if (status === 404) {
    // Excluir o que já não existe é o resultado desejado
    if (item.type === "excluirBaralho" || item.type === "excluirFicha") return null;
    if (item.type === "editarFicha") {
      return `A ficha “${cardQuestion(item.deckId, item.cardId, item.question)}” não existe mais na sua conta.`;
    }
    if (item.type === "estudo") {
      return `Não foi possível guardar o estudo de “${deckTitle(item.deckId)}” no histórico.`;
    }
    return `O baralho “${deckTitle(item.deckId)}” não existe mais na sua conta.`;
  }
  return `Não foi possível enviar uma alteração de “${deckTitle(item.deckId)}”.`;
}

/**
 * Estudo: uma chamada com a rota nova. Sem ela, abre a sessão, registra cada
 * resposta e conclui, guardando o progresso para retomar a mesma sessão se cair
 * a internet (em vez de deixar uma sessão pela metade e abrir outra).
 */
async function sendStudy(item: Extract<QueueItem, { type: "estudo" }>, api: QueueApi) {
  // Uma chamada com a rodada inteira; o id do item evita sessão duplicada se a
  // resposta se perder e o pedido for repetido
  await api.completeStudySession({
    id: item.id,
    deckId: item.deckId,
    startedAt: item.startedAt,
    completedAt: item.completedAt,
    answers: item.answers,
  });
}

/** Recusa definitiva da API (4xx): não adianta tentar de novo. */
function isDefinitive(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status >= 400 && error.status < 500 &&
    error.status !== 408 && error.status !== 429
  );
}

async function run(userId: string, api: QueueApi): Promise<QueueResult> {
  const result: QueueResult = { sent: 0, failures: [], stoppedOffline: false, stoppedSession: false };
  // Relê a fila a cada volta: um item pode ter virado vários (fichas) ou ter mudado de id
  for (let guard = 0; guard < 10000; guard++) {
    const item = readQueue(userId)[0];
    if (!item) break;
    try {
      await sendItem(userId, item, api);
      result.sent++;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        result.stoppedSession = true;
        break;
      }
      // Sem internet, API acordando ou com problema (5xx, 408, 429) ou erro no
      // aparelho: para e tenta de novo depois, sem perder a alteração
      if (!isDefinitive(error)) {
        result.stoppedOffline = true;
        break;
      }
      const failure = failureFor(item, (error as ApiError).status);
      if (failure) result.failures.push(failure);
      else result.sent++;
      if (item.type === "criarBaralho") {
        // A conta recusou o baralho: ele volta a ser do aparelho (dá para levar depois)
        // e as outras alterações dele saem da fila
        writeQueue(userId, readQueue(userId).filter((i) => i.deckId !== item.deckId));
        updateLocalDeck(item.deckId, (d) => ({ ...d, kind: "aparelho", account: null }));
      } else {
        removeFirst(userId, item.id);
      }
    }
  }
  return result;
}

/** Envia a fila em ordem. Uma aba por vez, para nada ser enviado duas vezes. */
export async function processQueue(userId: string, api: QueueApi): Promise<QueueResult> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  if (locks) return await locks.request("cardvoz-fila", () => run(userId, api));
  return run(userId, api);
}
