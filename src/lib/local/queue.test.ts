import { describe, expect, it, vi } from "vitest";
import { ApiError, type DeckDetailResponse } from "@/lib/api";
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
    importDeck: vi.fn(),
    updateDeck: vi.fn().mockResolvedValue({}),
    deleteDeck: vi.fn().mockResolvedValue(undefined),
    createCard: vi.fn(),
    updateCard: vi.fn().mockResolvedValue({}),
    deleteCard: vi.fn().mockResolvedValue(undefined),
    completeStudySession: vi.fn().mockResolvedValue(undefined),
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
    // O id do aparelho vai junto: repetir o pedido não duplica o baralho nem a sessão
    expect(api.importDeck).toHaveBeenCalledWith(expect.objectContaining({ id: "l1" }));
    expect(api.completeStudySession).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        deckId: "r1",
        answers: [expect.objectContaining({ cardId: "rc1" })],
      })
    );
    const local = findLocalDeck("l1");
    expect(local?.id).toBe("r1");
    expect(local?.aliases).toContain("l1");
    expect(local?.account?.remoteId).toBe("r1");
    expect(local?.cards[0].id).toBe("rc1");
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

describe("fila: erros da API", () => {
  it("erro temporário do servidor (500) para a fila e guarda o item", async () => {
    contaDeck("d1");
    enqueue(USER, { type: "renomearBaralho", deckId: "d1", title: "A" });
    const api = fakeApi();
    api.updateDeck.mockRejectedValue(new ApiError(503, "acordando"));

    const result = await processQueue(USER, api);

    expect(result.stoppedOffline).toBe(true);
    expect(result.failures).toEqual([]);
    expect(readQueue(USER)).toHaveLength(1);
  });

  it("baralho novo recusado pela API volta a ser do aparelho para levar depois", async () => {
    const deck = contaDeck("l1");
    saveLocalDeck({ ...deck, account: { userId: USER, remoteId: "", remoteUpdatedAt: null } });
    enqueue(USER, { type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral", cards: [] });
    const api = fakeApi();
    api.importDeck.mockRejectedValue(new ApiError(400, "inválido"));

    const result = await processQueue(USER, api);

    expect(result.failures).toHaveLength(1);
    expect(findLocalDeck("l1")).toMatchObject({ kind: "aparelho", account: null });
  });

  it("guarda o id antigo da ficha depois do envio", async () => {
    contaDeck("d1", [{ id: "c1", question: "q" }]);
    enqueue(USER, { type: "criarFicha", deckId: "d1", localId: "c1", question: "q", answer: "r", displayOrder: 1 });
    const api = fakeApi();
    api.createCard.mockResolvedValue({ id: "rc1", deckId: "d1", question: "q", answer: "r", displayOrder: 1, createdAt: "x" });

    await processQueue(USER, api);

    const card = findLocalDeck("d1")?.cards[0];
    expect(card?.id).toBe("rc1");
    expect(card?.aliases).toContain("c1");
  });
});

describe("fila: retomadas sem duplicar", () => {
  it("estudo vai numa chamada, com o id do item: repetir não duplica a sessão", async () => {
    contaDeck("d1");
    enqueue(USER, {
      type: "estudo", deckId: "d1", startedAt: "a", completedAt: "b",
      answers: [{ cardId: "c1", wasCorrect: true, answeredAt: "b" }],
    });
    const itemId = readQueue(USER)[0].id;
    const api = fakeApi();
    api.completeStudySession.mockRejectedValueOnce(new ApiError(0, "resposta perdida"));

    await processQueue(USER, api);
    expect(pendingCount(USER)).toBe(1);
    await processQueue(USER, api);

    expect(api.completeStudySession.mock.calls.map((c) => c[0].id)).toEqual([itemId, itemId]);
    expect(pendingCount(USER)).toBe(0);
  });

  it("baralho cuja resposta se perdeu é pedido de novo com o mesmo id", async () => {
    contaDeck("l1", [{ id: "c1", question: "q0" }]);
    enqueue(USER, {
      type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral",
      cards: [{ localId: "c1", question: "q0", answer: "r" }],
    });
    const api = fakeApi();
    api.importDeck.mockRejectedValueOnce(new ApiError(0, "resposta perdida"));
    await processQueue(USER, api);

    // A API reconhece o id e devolve o baralho já criado (200), sem duplicar
    api.importDeck.mockResolvedValue(apiDeck("l1", ["rc1"]));
    await processQueue(USER, api);

    expect(api.importDeck.mock.calls.map((c) => c[0].id)).toEqual(["l1", "l1"]);
    expect(findLocalDeck("l1")?.cards[0].id).toBe("rc1");
    expect(pendingCount(USER)).toBe(0);
  });
});


describe("fila: baralho devolvido sem as mudanças feitas depois", () => {
  it("manda as fichas que faltam e exclui as que a pessoa já tinha excluído", async () => {
    // A primeira tentativa salvou A, B e C; depois, sem internet, B saiu e D entrou
    contaDeck("l1", [{ id: "a", question: "A" }, { id: "c", question: "C" }, { id: "d", question: "D" }]);
    enqueue(USER, {
      type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral",
      cards: [
        { localId: "a", question: "A", answer: "r" },
        { localId: "c", question: "C", answer: "r" },
        { localId: "d", question: "D", answer: "r", correctCount: 2, incorrectCount: 0 },
      ],
    });
    const saved = apiDeck("l1", ["ra", "rb", "rc"]);
    saved.cards = saved.cards.map((c, i) => ({ ...c, question: ["A", "B", "C"][i] }));
    const api = fakeApi();
    api.importDeck.mockResolvedValue(saved);
    api.createCard.mockResolvedValue({ id: "rd", deckId: "l1", question: "D", answer: "r", displayOrder: 3, createdAt: "x" });

    await processQueue(USER, api);

    expect(api.deleteCard).toHaveBeenCalledWith("rb");
    expect(api.createCard).toHaveBeenCalledWith(expect.objectContaining({ deckId: "l1", question: "D", correctCount: 2 }));
    expect(findLocalDeck("l1")?.cards.map((c) => c.id)).toEqual(["ra", "rc", "rd"]);
    expect(pendingCount(USER)).toBe(0);
  });

  it("renomeia quando o nome mudou depois da primeira tentativa", async () => {
    contaDeck("l1", [{ id: "a", question: "q0" }]);
    enqueue(USER, {
      type: "criarBaralho", deckId: "l1", title: "Biologia", category: "Geral",
      cards: [{ localId: "a", question: "q0", answer: "r" }],
    });
    const api = fakeApi();
    api.importDeck.mockResolvedValue(apiDeck("l1", ["ra"]));

    await processQueue(USER, api);

    expect(api.updateDeck).toHaveBeenCalledWith("l1", { title: "Biologia" });
    expect(api.deleteCard).not.toHaveBeenCalled();
    expect(api.createCard).not.toHaveBeenCalled();
  });

  it("ficha importada de arquivo num baralho pendente leva o histórico", () => {
    contaDeck("l1");
    enqueue(USER, { type: "criarBaralho", deckId: "l1", title: "Bio", category: "Geral", cards: [] });
    enqueue(USER, {
      type: "criarFicha", deckId: "l1", localId: "a", question: "q", answer: "r", displayOrder: 1,
      stats: { correctCount: 3, incorrectCount: 1 },
    });
    const item = readQueue(USER)[0];
    expect(item.type === "criarBaralho" && item.cards[0]).toMatchObject({ correctCount: 3, incorrectCount: 1 });
  });

  it("estudo de antes da 0.11 parado no meio não manda de novo as respostas já enviadas", async () => {
    contaDeck("d1");
    enqueue(USER, {
      type: "estudo", deckId: "d1", startedAt: "a", completedAt: "b", sentAnswers: 1,
      answers: [
        { cardId: "c1", wasCorrect: true, answeredAt: "b" },
        { cardId: "c2", wasCorrect: false, answeredAt: "b" },
      ],
    });
    const api = fakeApi();

    await processQueue(USER, api);

    expect(api.completeStudySession.mock.calls[0][0].answers).toEqual([
      { cardId: "c2", wasCorrect: false, answeredAt: "b" },
    ]);
  });
});
