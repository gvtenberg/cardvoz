/**
 * O que as páginas usam para ler e mudar baralhos.
 *
 * Tudo é lido do aparelho (abre na hora, funciona sem internet). Sem conta, as
 * mudanças ficam só no aparelho. Com conta, as mudanças nas cópias da conta
 * também entram na fila, que vai para a API quando há internet; em seguida as
 * cópias são atualizadas com o que mudou na conta (em outro aparelho, por ex.).
 */
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { ApiError, RouteMissingError, type DeckDetailResponse, type DeckResponse } from "@/lib/api";
import { errorMessage } from "@/lib/http";
import { getSavedAccount, saveAccount, type SavedAccount } from "@/lib/local/account";
import {
  DECKS_KEY,
  findLocalDeck,
  fromApiDeck,
  listLocalDecks,
  newDeviceDeck,
  newLocalCards,
  removeLocalDeck,
  saveLocalDeck,
  toDeckDetail,
  toDeckResponse,
  updateLocalDeck,
  type DeckLanguages,
  type LocalDeck,
} from "@/lib/local/decks";
import { enqueue, hasPendingFor, pendingCount, processQueue, QUEUE_KEY } from "@/lib/local/queue";
import { onLocalChange } from "@/lib/local/storage";

export type DeckKind = LocalDeck["kind"];
export type DeckItem = DeckResponse & { kind: DeckKind } & DeckLanguages;
export type DeckDetail = DeckDetailResponse & { kind: DeckKind } & DeckLanguages;

// --- Conta ativa e conexão ---------------------------------------------------

/** undefined = ainda não conferido (lê a conta salva na primeira vez) */
let activeAccount: SavedAccount | null | undefined;
/** "desconhecida" até o login ser conferido; aí "online" (logado) ou "offline" */
export type Connection = "desconhecida" | "online" | "offline";
let connection: Connection = "desconhecida";

/**
 * Muda a cada troca de conta (inclusive ao sair). Uma sincronização que começou
 * com outra conta para de gravar: sem isso, uma resposta lenta da API depois do
 * "Sair" traria os baralhos da conta de volta ao aparelho.
 */
let generation = 0;

export function setActiveAccount(account: SavedAccount | null): void {
  if ((account?.id ?? null) !== (activeAccount?.id ?? null)) generation++;
  activeAccount = account;
  emit();
}

export function isCurrentAccount(userId: string): boolean {
  return getActiveAccount()?.id === userId;
}

/** O que fazer quando a internet volta, conforme o estado do login. */
export function reconnectAction(status: string): "restaurar" | "sincronizar" | "nada" {
  if (status === "erro") return "restaurar";
  if (status === "logado") return "sincronizar";
  return "nada";
}

export function getActiveAccount(): SavedAccount | null {
  if (activeAccount === undefined) {
    activeAccount = typeof window === "undefined" ? null : getSavedAccount();
  }
  return activeAccount;
}

/** true quando há sessão válida e a API respondeu; false sem internet ou sem conta. */
export function setOnline(canSync: boolean): void {
  connection = canSync ? "online" : "offline";
  emit();
}

// --- Estado da sincronização (para o aviso global) ---------------------------

export interface SyncState {
  pending: number;
  running: boolean;
  offline: boolean;
  connection: Connection;
  lastFailures: string[];
  /** Quando a última sincronização enviou alguma alteração (para o aviso de enviado) */
  lastSentAt: number | null;
  message: string;
  /** Muda a cada announce, para o aviso reaparecer mesmo com o mesmo texto */
  messageAt: number;
  messageTone: "sucesso" | "erro";
}

const syncListeners = new Set<(s: SyncState) => void>();
let running = false;
let lastOffline = false;
let lastFailures: string[] = [];
let lastSentAt: number | null = null;
let message = "";
let messageAt = 0;
let messageTone: "sucesso" | "erro" = "sucesso";

function currentState(): SyncState {
  const account = getActiveAccount();
  return {
    pending: account ? pendingCount(account.id) : 0,
    running,
    offline: lastOffline || connection === "offline",
    connection,
    lastFailures,
    lastSentAt,
    message,
    messageAt,
    messageTone,
  };
}

function emit() {
  const state = currentState();
  syncListeners.forEach((listener) => listener(state));
}

export function onSyncState(listener: (s: SyncState) => void): () => void {
  syncListeners.add(listener);
  listener(currentState());
  // A fila muda também por outras abas
  const stop = onLocalChange((key) => {
    if (key === QUEUE_KEY || key === "") listener(currentState());
  });
  return () => {
    syncListeners.delete(listener);
    stop();
  };
}

/** Mensagem avulsa no aviso global (ex.: "3 baralhos levados para sua conta."). */
export function announce(text: string, tone: "sucesso" | "erro" = "sucesso"): void {
  message = text;
  messageTone = tone;
  messageAt = Date.now();
  emit();
}

// --- Leituras ----------------------------------------------------------------

export function listDecks(): DeckItem[] {
  return listLocalDecks().map(toDeckResponse);
}

export function findDeck(idOrSlug: string): DeckDetail | null {
  const deck = findLocalDeck(idOrSlug);
  return deck ? toDeckDetail(deck) : null;
}

// --- Escritas ----------------------------------------------------------------

/** Id atual da ficha: telas abertas antes de a fila enviar ainda usam o id antigo. */
function resolveCardId(deck: LocalDeck, cardId: string): string {
  return deck.cards.find((c) => c.id === cardId || c.aliases?.includes(cardId))?.id ?? cardId;
}

/** Cópia da conta ativa: mudanças também vão para a fila. */
function accountOf(deck: LocalDeck): SavedAccount | null {
  const account = getActiveAccount();
  return deck.kind === "conta" && account && deck.account?.userId === account.id ? account : null;
}

function touch(deck: LocalDeck, change: Partial<LocalDeck>): LocalDeck {
  return {
    ...deck,
    ...change,
    updatedAt: new Date().toISOString(),
    // Baralho que veio de uma conta, mudado depois de sair: na volta, a pessoa escolhe a versão
    editedOffAccount: deck.editedOffAccount || (deck.kind === "aparelho" && deck.account !== null),
  };
}

function kick() {
  if (connection === "online") void syncAccount();
}

export function createDeck(data: {
  title: string;
  cards?: { question: string; answer: string }[];
  questionLang?: string | null;
  answerLang?: string | null;
}): DeckItem {
  const account = getActiveAccount();
  const deck = newDeviceDeck(data);
  if (!account) return toDeckResponse(deck);

  // Baralho novo com conta: é da conta desde já; o id da API chega quando a fila enviar
  const copy: LocalDeck = {
    ...deck,
    kind: "conta",
    account: { userId: account.id, remoteId: "", remoteUpdatedAt: null },
  };
  saveLocalDeck(copy);
  enqueue(account.id, {
    type: "criarBaralho",
    deckId: copy.id,
    title: copy.title,
    category: copy.category,
    cards: copy.cards.map((c) => ({ localId: c.id, question: c.question, answer: c.answer })),
  });
  kick();
  return toDeckResponse(copy);
}

/**
 * Vários baralhos de uma vez (arquivo de "Exportar todos"): tudo ou nada. Se o
 * espaço acabar no meio, os já criados são desfeitos, para tentar de novo não
 * duplicar.
 */
export function createDecks(decks: Parameters<typeof createDeck>[0][]): DeckItem[] {
  const created: DeckItem[] = [];
  try {
    for (const deck of decks) created.push(createDeck(deck));
    return created;
  } catch (error) {
    for (const deck of created) {
      try {
        deleteDeck(deck.id);
      } catch {}
    }
    throw error;
  }
}

/**
 * Idioma das perguntas e das respostas, para o leitor de tela trocar a voz.
 * Só no aparelho (a API ainda não tem esses campos), então não entra na fila.
 */
export function setDeckLanguages(id: string, languages: DeckLanguages): void {
  updateLocalDeck(id, (d) => ({ ...d, ...languages }));
}

export function renameDeck(id: string, title: string): void {
  const deck = findLocalDeck(id);
  if (!deck) return;
  updateLocalDeck(deck.id, (d) => touch(d, { title }));
  const account = accountOf(deck);
  if (account) {
    enqueue(account.id, { type: "renomearBaralho", deckId: deck.id, title });
    kick();
  }
}

export function deleteDeck(id: string): void {
  const deck = findLocalDeck(id);
  if (!deck) return;
  removeLocalDeck(deck.id);
  const account = accountOf(deck);
  if (account) {
    enqueue(account.id, { type: "excluirBaralho", deckId: deck.id });
    kick();
  }
}

export function addCards(deckId: string, cards: { question: string; answer: string }[]): void {
  const deck = findLocalDeck(deckId);
  if (!deck || cards.length === 0) return;
  const start = deck.cards.reduce((max, c) => Math.max(max, c.displayOrder), 0) + 1;
  const created = newLocalCards(cards, start);
  updateLocalDeck(deck.id, (d) => touch(d, { cards: [...d.cards, ...created] }));
  const account = accountOf(deck);
  if (account) {
    for (const card of created) {
      enqueue(account.id, {
        type: "criarFicha",
        deckId: deck.id,
        localId: card.id,
        question: card.question,
        answer: card.answer,
        displayOrder: card.displayOrder,
      });
    }
    kick();
  }
}

export function editCard(deckId: string, oldCardId: string, data: { question: string; answer: string }): void {
  const deck = findLocalDeck(deckId);
  if (!deck) return;
  const cardId = resolveCardId(deck, oldCardId);
  updateLocalDeck(deck.id, (d) =>
    touch(d, { cards: d.cards.map((c) => (c.id === cardId ? { ...c, ...data } : c)) })
  );
  const account = accountOf(deck);
  if (account) {
    enqueue(account.id, { type: "editarFicha", deckId: deck.id, cardId, ...data });
    kick();
  }
}

export function deleteCard(deckId: string, oldCardId: string): void {
  const deck = findLocalDeck(deckId);
  if (!deck) return;
  const cardId = resolveCardId(deck, oldCardId);
  updateLocalDeck(deck.id, (d) => touch(d, { cards: d.cards.filter((c) => c.id !== cardId) }));
  const account = accountOf(deck);
  if (account) {
    enqueue(account.id, { type: "excluirFicha", deckId: deck.id, cardId });
    kick();
  }
}

/** Resultado de uma rodada de estudo. Baralho só do aparelho não guarda histórico. */
export function saveStudyResult(
  deckId: string,
  result: { startedAt: string; answers: { cardId: string; wasCorrect: boolean; answeredAt: string }[] }
): void {
  const deck = findLocalDeck(deckId);
  if (!deck) return;
  const account = accountOf(deck);
  if (!account || result.answers.length === 0) return;
  enqueue(account.id, {
    type: "estudo",
    deckId: deck.id,
    startedAt: result.startedAt,
    completedAt: new Date().toISOString(),
    answers: result.answers.map((a) => ({ ...a, cardId: resolveCardId(deck, a.cardId) })),
  });
  kick();
}

// --- Sincronização com a conta -----------------------------------------------

export interface SyncResult {
  failures: string[];
  offline: boolean;
}

let currentSync: Promise<SyncResult> | null = null;

/** Guarda a versão da conta sem perder os endereços antigos do baralho. */
function storeCopy(remote: DeckDetailResponse, userId: string) {
  const existing = findLocalDeck(remote.id);
  // Só herda os endereços antigos do próprio baralho (não de outro que use este id como antigo)
  const same = existing?.id === remote.id ? existing : null;
  // O idioma fica só no aparelho: a versão da conta não o traz
  saveLocalDeck({
    ...fromApiDeck(remote, userId),
    aliases: same?.aliases ?? [],
    questionLang: same?.questionLang ?? null,
    answerLang: same?.answerLang ?? null,
  });
}

/** Baralhos que vieram desta conta e voltaram a ser do aparelho: quem decide é a pessoa. */
function heldByDevice(userId: string): Set<string> {
  const held = new Set<string>();
  for (const d of listLocalDecks()) {
    if (d.kind === "aparelho" && d.account?.userId === userId) held.add(d.account.remoteId);
    // Sendo levado para a conta agora: a cópia nasce quando o envio terminar
    if (d.upload) held.add(d.upload.remoteId);
  }
  return held;
}

function removeVanished(userId: string, remoteIds: Set<string>) {
  for (const deck of listLocalDecks()) {
    if (deck.kind !== "conta" || deck.account?.userId !== userId) continue;
    if (!deck.account.remoteId || hasPendingFor(userId, deck.id)) continue;
    if (!remoteIds.has(deck.id)) removeLocalDeck(deck.id);
  }
}

async function refreshCopies(account: SavedAccount, gen: number) {
  const held = heldByDevice(account.id);
  const stale = () => gen !== generation;
  try {
    const changes = await api.getDeckChanges(account.lastSync ?? null);
    if (stale()) return;
    for (const remote of changes.decks) {
      if (!held.has(remote.id) && !hasPendingFor(account.id, remote.id)) storeCopy(remote, account.id);
    }
    removeVanished(account.id, new Set(changes.allIds));
    saveAccount({ ...account, lastSync: changes.serverTime });
    return;
  } catch (error) {
    if (!(error instanceof RouteMissingError)) throw error;
  }

  const remotes = await api.getDecks();
  for (const remote of remotes) {
    if (stale()) return;
    if (held.has(remote.id) || hasPendingFor(account.id, remote.id)) continue;
    const found = findLocalDeck(remote.id);
    const local = found?.id === remote.id ? found : null;
    const changed =
      !local ||
      local.account?.remoteUpdatedAt !== (remote.updatedAt ?? null) ||
      local.cards.length !== remote.cardCount;
    if (!changed) continue;
    const detail = await api.getDeck(remote.id);
    if (detail && !stale()) storeCopy(detail, account.id);
  }
  if (stale()) return;
  removeVanished(account.id, new Set(remotes.map((r) => r.id)));
}

async function runSync(account: SavedAccount): Promise<SyncResult> {
  const gen = generation;
  running = true;
  message = "";
  emit();
  const result: SyncResult = { failures: [], offline: false };
  try {
    const queued = await processQueue(account.id, api);
    result.failures = queued.failures;
    result.offline = queued.stoppedOffline;
    if (queued.sent > 0 && pendingCount(account.id) === 0) lastSentAt = Date.now();
    if (!queued.stoppedOffline && !queued.stoppedSession && gen === generation) {
      await refreshCopies(account, gen);
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 0) result.offline = true;
    else console.warn("CardVoz: falha ao atualizar os baralhos da conta.", errorMessage(error, ""));
  } finally {
    running = false;
    lastOffline = result.offline;
    lastFailures = result.failures;
    emit();
  }
  return result;
}

/** Envia a fila e atualiza as cópias. Uma sincronização por vez. */
export function syncAccount(): Promise<SyncResult> {
  const account = getActiveAccount();
  if (!account || connection !== "online") return Promise.resolve({ failures: [], offline: true });
  if (!currentSync) {
    currentSync = runSync(account).finally(() => {
      currentSync = null;
    });
  }
  return currentSync;
}

/** Baralho que não está no aparelho (criado em outro aparelho, por ex.): busca na conta. */
export async function fetchDeckFromAccount(idOrSlug: string): Promise<DeckDetail | null> {
  const account = getActiveAccount();
  if (!account || connection !== "online") return null;
  const remote = await api.getDeck(idOrSlug);
  if (!remote) return null;
  if (!findLocalDeck(remote.id)) storeCopy(remote, account.id);
  return findDeck(remote.id);
}

// --- Baralhos prontos (só com conta e internet) ------------------------------

export function listSharedDecks(): Promise<DeckResponse[]> {
  return api.getSharedDecks();
}

export async function copySharedDeck(id: string): Promise<DeckItem> {
  const account = getActiveAccount();
  const copy = await api.copySharedDeck(id);
  const detail = await api.getDeck(copy.id);
  if (account && detail) storeCopy(detail, account.id);
  return findDeck(copy.id) ?? { ...copy, kind: "conta", questionLang: null, answerLang: null };
}

// --- Hooks -------------------------------------------------------------------

/** Lista de baralhos, atualizada quando o aparelho ou a conta mudam. null = ainda lendo. */
export function useDecks(): { decks: DeckItem[] | null; firstSync: boolean } {
  const [decks, setDecks] = useState<DeckItem[] | null>(null);
  const [sync, setSync] = useState<SyncState | null>(null);

  useEffect(() => {
    // Lê só no navegador: o build estático não tem localStorage
    setDecks(listDecks());
    const stopLocal = onLocalChange((key) => {
      if (key === DECKS_KEY || key === "") setDecks(listDecks());
    });
    const stopSync = onSyncState(setSync);
    return () => {
      stopLocal();
      stopSync();
    };
  }, []);

  const hasAccountCopies = decks?.some((d) => d.kind === "conta") ?? false;
  const waitingAccount =
    getActiveAccount() !== null && !hasAccountCopies &&
    (sync?.connection === "desconhecida" || (sync?.running ?? false));
  return { decks, firstSync: waitingAccount };
}

/** Um baralho pelo id (ou endereço antigo). Busca na conta se não estiver no aparelho. */
export function useDeck(idOrSlug: string): { deck: DeckDetail | null; loading: boolean; error: string } {
  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [conn, setConn] = useState(connection);

  useEffect(() => onSyncState((s) => setConn(s.connection)), []);

  useEffect(() => {
    let active = true;
    const read = () => {
      const local = findDeck(idOrSlug);
      if (active) setDeck(local);
      return local;
    };
    setError("");
    if (!idOrSlug) {
      setDeck(null);
      setLoading(false);
    } else if (read()) {
      setLoading(false);
    } else if (getActiveAccount() && conn === "desconhecida") {
      // Ainda conferindo o login: espera antes de dizer "não encontrado"
      setLoading(true);
    } else if (getActiveAccount() && conn === "online") {
      setLoading(true);
      fetchDeckFromAccount(idOrSlug)
        .then((found) => active && setDeck(found))
        .catch((e) => active && setError(errorMessage(e, "Não foi possível carregar o baralho. Tente de novo.")))
        .finally(() => active && setLoading(false));
    } else {
      setLoading(false);
    }
    const stop = onLocalChange((key) => {
      if (key === DECKS_KEY || key === "") read();
    });
    return () => {
      active = false;
      stop();
    };
  }, [idOrSlug, conn]);

  return { deck, loading, error };
}
