import { describe, expect, it, vi } from "vitest";
import { ApiError, RouteMissingError, type DeckDetailResponse } from "@/lib/api";
import { findLocalDeck, saveLocalDeck, type LocalDeck } from "./decks";
import {
  enqueue,
  hasPendingFor,
  pendingCount,
  processQueue,
  readQueue,
  type QueueApi,
} from "./queue";

const USER = "u1";

function contaDeck(id: string, cards: { id: string; question: string }[] = []): LocalDeck {
  const deck: LocalDeck = {
    id,
    aliases: [],
    title: "Bio",
    category: "Geral",
    description: null,
    sourceDeckId: null,
    createdAt: "2026-10-30T00:00:00Z",
    updatedAt: "2026-10-30T00:00:00Z",
    cards: cards.map((c, i) => ({ ...c, answer: "r", displayOrder: i + 1, createdAt: "x" })),
    kind: "conta",
    account: { userId: USER, remoteId: id, remoteUpdatedAt: null },
    editedOffAccount: false,
    upload: null,
  };
  saveLocalDeck(deck);
  return deck;
}

function apiDeck(id: string, cardIds: string[]): DeckDetailResponse {
  return {
    id,
    slug: id,
    title: "Bio",
    category: "Geral",
    cardCount: cardIds.length,
    createdAt: "x",
    updatedAt: "2026-10-31T00:00:00Z",
    cards: cardIds.map((cid, i) => ({
      id: cid,
      deckId: id,
      question: `q${i}`,
      answer: "r",
      displayOrder: i + 1,
      createdAt: "x",
    })),
  };
}

function fakeApi(): { [K in keyof QueueApi]: ReturnType<typeof vi.fn> } & QueueApi {
  return {
    createDeck: vi.fn(),
    importDeck: vi.fn(),
    updateDeck: vi.fn().mockResolvedValue({}),
    deleteDeck: vi.fn().mockResolvedValue(undefined),
    createCard: vi.fn(),
    updateCard: vi.fn().mockResolvedValue({}),
    deleteCard: vi.fn().mockResolvedValue(undefined),
    saveStudySession: vi.fn().mockResolvedValue(undefined),
  } as never;
}

describe("fila de alterações", () => {
  it("criar e excluir um baralho antes de enviar não deixa nada na fila", () => {
    enqueue(USER, { type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral", cards: [] });
    enqueue(USER, { type: "criarFicha", deckId: "l1", localId: "c1", question: "q", answer: "r", displayOrder: 1 });
    enqueue(USER, { type: "excluirBaralho", deckId: "l1" });
    expect(pendingCount(USER)).toBe(0);
  });

  it("editar uma ficha ainda não enviada muda o item pendente", () => {
    enqueue(USER, { type: "criarFicha", deckId: "d1", localId: "c1", question: "q", answer: "r", displayOrder: 1 });
    enqueue(USER, { type: "editarFicha", deckId: "d1", cardId: "c1", question: "q2", answer: "r2" });
    const items = readQueue(USER);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "criarFicha", question: "q2", answer: "r2" });
  });

  it("excluir uma ficha ainda não enviada remove os dois itens", () => {
    enqueue(USER, { type: "criarFicha", deckId: "d1", localId: "c1", question: "q", answer: "r", displayOrder: 1 });
    enqueue(USER, { type: "excluirFicha", deckId: "d1", cardId: "c1" });
    expect(pendingCount(USER)).toBe(0);
  });

  it("renomear um baralho ainda não enviado muda o próprio item", () => {
    enqueue(USER, { type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral", cards: [] });
    enqueue(USER, { type: "renomearBaralho", deckId: "l1", title: "Bio 2" });
    const items = readQueue(USER);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "criarBaralho", title: "Bio 2" });
  });

  it("ficha nova em baralho ainda não enviado entra no próprio baralho", () => {
    enqueue(USER, { type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral", cards: [] });
    enqueue(USER, { type: "criarFicha", deckId: "l1", localId: "c1", question: "q", answer: "r", displayOrder: 1 });
    const items = readQueue(USER);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ type: "criarBaralho", cards: [{ localId: "c1", question: "q" }] });
  });

  it("envia o baralho novo e usa o id da API nos itens seguintes", async () => {
    contaDeck("l1", [{ id: "c1", question: "q0" }]);
    enqueue(USER, {
      type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral",
      cards: [{ localId: "c1", question: "q0", answer: "r" }],
    });
    enqueue(USER, {
      type: "estudo", deckId: "l1", startedAt: "a", completedAt: "b",
      answers: [{ cardId: "c1", wasCorrect: true, answeredAt: "b" }],
    });
    const api = fakeApi();
    api.importDeck.mockResolvedValue(apiDeck("r1", ["rc1"]));

    const result = await processQueue(USER, api);

    expect(result.sent).toBe(2);
    expect(api.saveStudySession).toHaveBeenCalledWith(
      expect.objectContaining({ deckId: "r1", answers: [expect.objectContaining({ cardId: "rc1" })] })
    );
    const local = findLocalDeck("l1");
    expect(local?.id).toBe("r1");
    expect(local?.aliases).toContain("l1");
    expect(local?.account?.remoteId).toBe("r1");
    expect(local?.cards[0].id).toBe("rc1");
  });

  it("sem a rota nova, cria o baralho e as fichas uma a uma", async () => {
    contaDeck("l1", [{ id: "c1", question: "a" }, { id: "c2", question: "b" }]);
    enqueue(USER, {
      type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral",
      cards: [
        { localId: "c1", question: "a", answer: "r" },
        { localId: "c2", question: "b", answer: "r" },
      ],
    });
    const api = fakeApi();
    api.importDeck.mockRejectedValue(new RouteMissingError());
    api.createDeck.mockResolvedValue({ id: "r1", slug: "r1", title: "Bio", category: "Geral", cardCount: 0, createdAt: "x" });
    api.createCard
      .mockResolvedValueOnce({ id: "rc1", deckId: "r1", question: "a", answer: "r", displayOrder: 1, createdAt: "x" })
      .mockResolvedValueOnce({ id: "rc2", deckId: "r1", question: "b", answer: "r", displayOrder: 2, createdAt: "x" });

    await processQueue(USER, api);

    expect(api.createCard.mock.calls.map((c) => c[0].question)).toEqual(["a", "b"]);
    expect(api.createCard.mock.calls[0][0].deckId).toBe("r1");
    expect(findLocalDeck("r1")?.cards.map((c) => c.id)).toEqual(["rc1", "rc2"]);
    expect(pendingCount(USER)).toBe(0);
  });

  it("para sem internet e mantém o resto na fila", async () => {
    contaDeck("d1");
    enqueue(USER, { type: "renomearBaralho", deckId: "d1", title: "A" });
    enqueue(USER, { type: "excluirFicha", deckId: "d1", cardId: "c9" });
    const api = fakeApi();
    api.deleteCard.mockRejectedValue(new ApiError(0, "sem internet"));

    const result = await processQueue(USER, api);

    expect(result.sent).toBe(1);
    expect(result.stoppedOffline).toBe(true);
    expect(readQueue(USER)).toHaveLength(1);
  });

  it("ficha que não existe mais vira aviso e a fila segue", async () => {
    contaDeck("d1", [{ id: "c1", question: "Qual organela produz energia?" }]);
    enqueue(USER, { type: "editarFicha", deckId: "d1", cardId: "c1", question: "Qual organela produz energia?", answer: "x" });
    enqueue(USER, { type: "renomearBaralho", deckId: "d1", title: "A" });
    const api = fakeApi();
    api.updateCard.mockRejectedValue(new ApiError(404, "não achou"));

    const result = await processQueue(USER, api);

    expect(result.failures).toEqual(["A ficha “Qual organela produz energia?” não existe mais na sua conta."]);
    expect(api.updateDeck).toHaveBeenCalled();
    expect(pendingCount(USER)).toBe(0);
  });

  it("informa quantos itens e de quais baralhos estão pendentes", () => {
    enqueue(USER, { type: "renomearBaralho", deckId: "d1", title: "A" });
    expect(pendingCount(USER)).toBe(1);
    expect(hasPendingFor(USER, "d1")).toBe(true);
    expect(hasPendingFor(USER, "d2")).toBe(false);
    expect(pendingCount("outra")).toBe(0);
  });
});
