import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...real,
    getDecks: vi.fn(),
    getDeck: vi.fn(),
    getDeckChanges: vi.fn(),
    importDeck: vi.fn(),
    createDeck: vi.fn(),
    createCard: vi.fn(),
    updateDeck: vi.fn(),
    deleteDeck: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    saveStudySession: vi.fn(),
  };
});

import * as api from "@/lib/api";
import { RouteMissingError, type DeckDetailResponse } from "@/lib/api";
import { getSavedAccount, saveAccount } from "@/lib/local/account";
import { findLocalDeck, fromApiDeck, saveLocalDeck } from "@/lib/local/decks";
import { enqueue, readQueue } from "@/lib/local/queue";
import {
  createDeck,
  editCard,
  listDecks,
  saveStudyResult,
  setActiveAccount,
  setOnline,
  syncAccount,
} from "./index";

const USER = { id: "u1", name: "Ana", email: "ana@x.com" };

function remote(id: string, updatedAt: string, cards = 1): DeckDetailResponse {
  return {
    id,
    slug: id,
    title: `Baralho ${id}`,
    category: "Geral",
    cardCount: cards,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt,
    cards: Array.from({ length: cards }, (_, i) => ({
      id: `${id}-c${i}`,
      deckId: id,
      question: `q${i}`,
      answer: "r",
      displayOrder: i + 1,
      createdAt: "x",
    })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setActiveAccount(null);
  setOnline(false);
});

describe("camada de dados", () => {
  it("sem conta, o baralho fica só no aparelho", () => {
    const deck = createDeck({ title: "Bio" });
    expect(deck.kind).toBe("aparelho");
    expect(readQueue(USER.id)).toHaveLength(0);
    expect(listDecks().map((d) => d.title)).toEqual(["Bio"]);
  });

  it("com conta, o baralho novo é da conta e entra na fila", () => {
    setActiveAccount(USER);
    const deck = createDeck({ title: "Bio", cards: [{ question: "a", answer: "b" }] });
    expect(deck.kind).toBe("conta");
    const items = readQueue(USER.id);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "criarBaralho", deckId: deck.id, cards: [{ question: "a" }] });
  });

  it("editar um baralho que veio de uma conta marca que ele mudou fora dela", () => {
    const copy = fromApiDeck(remote("r1", "t1"), USER.id);
    saveLocalDeck({ ...copy, kind: "aparelho" });
    editCard("r1", "r1-c0", { question: "nova", answer: "r" });
    const local = findLocalDeck("r1");
    expect(local?.editedOffAccount).toBe(true);
    expect(local?.cards[0].question).toBe("nova");
  });

  it("sem internet e com sessão salva, a edição da cópia vai para a fila sem chamar a API", () => {
    saveAccount(USER);
    saveLocalDeck(fromApiDeck(remote("r1", "t1"), USER.id));
    setActiveAccount(getSavedAccount());
    setOnline(false);

    editCard("r1", "r1-c0", { question: "nova", answer: "r" });

    expect(readQueue(USER.id)).toMatchObject([{ type: "editarFicha", cardId: "r1-c0", question: "nova" }]);
    expect(api.updateCard).not.toHaveBeenCalled();
  });

  it("sincroniza só o que mudou e remove o que saiu da conta", async () => {
    saveAccount(USER);
    setActiveAccount(USER);
    saveLocalDeck(fromApiDeck(remote("igual", "t1"), USER.id));
    saveLocalDeck(fromApiDeck(remote("mudou", "t1"), USER.id));
    saveLocalDeck(fromApiDeck(remote("sumiu", "t1"), USER.id));
    vi.mocked(api.getDeckChanges).mockRejectedValue(new RouteMissingError());
    vi.mocked(api.getDecks).mockResolvedValue([
      { ...remote("igual", "t1"), cards: undefined } as never,
      { ...remote("mudou", "t2", 2), cards: undefined } as never,
    ]);
    vi.mocked(api.getDeck).mockResolvedValue(remote("mudou", "t2", 2));

    setOnline(true);
    await syncAccount();

    expect(api.getDeck).toHaveBeenCalledTimes(1);
    expect(api.getDeck).toHaveBeenCalledWith("mudou");
    expect(findLocalDeck("mudou")?.cards).toHaveLength(2);
    expect(findLocalDeck("sumiu")).toBeNull();
    expect(findLocalDeck("igual")).not.toBeNull();
  });

  it("sem internet no meio da fila, não apaga nem atualiza cópias", async () => {
    saveAccount(USER);
    setActiveAccount(USER);
    saveLocalDeck(fromApiDeck(remote("r1", "t1"), USER.id));
    enqueue(USER.id, { type: "renomearBaralho", deckId: "r1", title: "x" });
    vi.mocked(api.updateDeck).mockRejectedValue(new api.ApiError(0, "sem internet"));

    setOnline(true);
    const result = await syncAccount();

    expect(result.offline).toBe(true);
    expect(api.getDecks).not.toHaveBeenCalled();
    expect(findLocalDeck("r1")).not.toBeNull();
    expect(readQueue(USER.id)).toHaveLength(1);
  });

  it("estudo de baralho do aparelho não guarda nada; da conta entra na fila", () => {
    const device = createDeck({ title: "Bio", cards: [{ question: "a", answer: "b" }] });
    saveStudyResult(device.id, { startedAt: "a", answers: [] });
    expect(readQueue(USER.id)).toHaveLength(0);

    setActiveAccount(USER);
    saveLocalDeck(fromApiDeck(remote("r1", "t1"), USER.id));
    saveStudyResult("r1", { startedAt: "a", answers: [{ cardId: "r1-c0", wasCorrect: true, answeredAt: "b" }] });
    expect(readQueue(USER.id)).toMatchObject([{ type: "estudo", deckId: "r1" }]);
  });
});
