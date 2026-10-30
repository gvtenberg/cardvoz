/**
 * Baralhos guardados no aparelho. É daqui que as telas leem tudo: os baralhos
 * só do aparelho e as cópias dos baralhos da conta (para abrir rápido e estudar
 * sem internet).
 *
 * Toda operação relê o armazenamento antes de gravar, para não apagar o que
 * outra aba acabou de salvar.
 */
import type { CardResponse, DeckDetailResponse, DeckResponse } from "@/lib/api";
import { readJson, requestPersistentStorage, writeJson } from "./storage";

export interface LocalCard {
  id: string;
  /** ids antigos (antes de a fila enviar a ficha): telas abertas ainda podem usá-los */
  aliases?: string[];
  question: string;
  answer: string;
  displayOrder: number;
  createdAt: string;
}

export interface AccountLink {
  userId: string;
  /** id do baralho na API */
  remoteId: string;
  /** updatedAt da API na última atualização da cópia */
  remoteUpdatedAt: string | null;
}

export interface LocalDeck {
  /** id nas rotas: o da API nas cópias da conta, um UUID nos do aparelho */
  id: string;
  /** ids antigos (antes de ir para a API): endereços antigos continuam abrindo */
  aliases: string[];
  title: string;
  category: string;
  description: string | null;
  sourceDeckId: string | null;
  createdAt: string;
  updatedAt: string;
  cards: LocalCard[];
  /** "conta" = cópia de um baralho da conta ativa */
  kind: "aparelho" | "conta";
  /** Em "conta", sempre; em "aparelho", de qual conta veio (depois de sair) ou null */
  account: AccountLink | null;
  /** Baralho que veio de uma conta e foi editado depois de sair dela */
  editedOffAccount: boolean;
  /** Envio para a conta em andamento: o baralho já existe na API com este id */
  upload: { remoteId: string } | null;
}

export const DECKS_KEY = "cardvoz.baralhos.v1";

function isCard(v: unknown): v is LocalCard {
  const c = v as LocalCard;
  return (
    typeof c === "object" && c !== null &&
    typeof c.id === "string" && typeof c.question === "string" &&
    typeof c.answer === "string" && typeof c.displayOrder === "number"
  );
}

function isDeck(v: unknown): v is LocalDeck {
  const d = v as LocalDeck;
  return (
    typeof d === "object" && d !== null &&
    typeof d.id === "string" && typeof d.title === "string" &&
    (d.kind === "aparelho" || d.kind === "conta") &&
    Array.isArray(d.cards) && d.cards.every(isCard) &&
    Array.isArray(d.aliases)
  );
}

const isArray = (v: unknown): v is unknown[] => Array.isArray(v);

function readAll(): LocalDeck[] {
  // Valida item a item: um baralho estragado não some com os outros
  return readJson<unknown[]>(DECKS_KEY, [], isArray).filter(isDeck);
}

function writeAll(decks: LocalDeck[]) {
  writeJson(DECKS_KEY, decks);
  requestPersistentStorage();
}

export function listLocalDecks(): LocalDeck[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function findLocalDeck(idOrSlug: string): LocalDeck | null {
  if (!idOrSlug) return null;
  return readAll().find((d) => d.id === idOrSlug || d.aliases.includes(idOrSlug)) ?? null;
}

export function saveLocalDeck(deck: LocalDeck): void {
  const all = readAll();
  const index = all.findIndex((d) => d.id === deck.id);
  if (index >= 0) all[index] = deck;
  else all.push(deck);
  writeAll(all);
}

export function updateLocalDeck(id: string, change: (d: LocalDeck) => LocalDeck): LocalDeck | null {
  const all = readAll();
  const index = all.findIndex((d) => d.id === id || d.aliases.includes(id));
  if (index < 0) return null;
  all[index] = change(all[index]);
  writeAll(all);
  return all[index];
}

export function removeLocalDeck(id: string): void {
  writeAll(readAll().filter((d) => d.id !== id && !d.aliases.includes(id)));
}

export function newLocalCards(
  cards: { question: string; answer: string }[],
  startOrder = 1
): LocalCard[] {
  const now = new Date().toISOString();
  return cards.map((c, i) => ({
    id: crypto.randomUUID(),
    question: c.question,
    answer: c.answer,
    displayOrder: startOrder + i,
    createdAt: now,
  }));
}

export function newDeviceDeck(data: {
  title: string;
  category?: string;
  cards?: { question: string; answer: string }[];
}): LocalDeck {
  const now = new Date().toISOString();
  const deck: LocalDeck = {
    id: crypto.randomUUID(),
    aliases: [],
    title: data.title,
    category: data.category ?? "Geral",
    description: null,
    sourceDeckId: null,
    createdAt: now,
    updatedAt: now,
    cards: newLocalCards(data.cards ?? []),
    kind: "aparelho",
    account: null,
    editedOffAccount: false,
    upload: null,
  };
  saveLocalDeck(deck);
  return deck;
}

export function fromApiDeck(d: DeckDetailResponse, userId: string): LocalDeck {
  return {
    id: d.id,
    aliases: [],
    title: d.title,
    category: d.category,
    description: d.description ?? null,
    sourceDeckId: d.sourceDeckId ?? null,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt ?? d.createdAt,
    cards: [...(d.cards ?? [])]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((c) => ({
        id: c.id,
        question: c.question,
        answer: c.answer,
        displayOrder: c.displayOrder,
        createdAt: c.createdAt,
      })),
    kind: "conta",
    account: { userId, remoteId: d.id, remoteUpdatedAt: d.updatedAt ?? null },
    editedOffAccount: false,
    upload: null,
  };
}

export function toDeckResponse(d: LocalDeck): DeckResponse & { kind: LocalDeck["kind"] } {
  return {
    id: d.id,
    slug: d.id,
    title: d.title,
    category: d.category,
    description: d.description,
    cardCount: d.cards.length,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    sourceDeckId: d.sourceDeckId,
    kind: d.kind,
  };
}

export function toDeckDetail(d: LocalDeck): DeckDetailResponse & { kind: LocalDeck["kind"] } {
  const cards: CardResponse[] = d.cards.map((c) => ({ ...c, deckId: d.id, voiceNotes: null }));
  return { ...toDeckResponse(d), cards };
}
