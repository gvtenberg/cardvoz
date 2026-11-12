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
    completeStudySession: vi.fn(),
  };
});

import * as api from "@/lib/api";
import { RouteMissingError, type DeckDetailResponse } from "@/lib/api";
import { clearSavedAccount, getSavedAccount, saveAccount } from "@/lib/local/account";
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

  it("estudo guarda acertos e erros no aparelho; só o da conta entra na fila", () => {
    const device = createDeck({ title: "Bio", cards: [{ question: "a", answer: "b" }] });
    const cardId = findLocalDeck(device.id)!.cards[0].id;
    saveStudyResult(device.id, { startedAt: "a", answers: [{ cardId, wasCorrect: false, answeredAt: "t1" }] });
    expect(readQueue(USER.id)).toHaveLength(0);
    const studied = findLocalDeck(device.id)!;
    expect(studied.cards[0]).toMatchObject({ correctCount: 0, incorrectCount: 1, lastWasCorrect: false });
    expect(studied.lastStudiedAt).toBe("t1");
    // Estudar não é editar: não muda a data de alteração do baralho
    expect(studied.updatedAt).toBe(device.updatedAt);

    setActiveAccount(USER);
    saveLocalDeck(fromApiDeck(remote("r1", "t1"), USER.id));
    saveStudyResult("r1", { startedAt: "a", answers: [{ cardId: "r1-c0", wasCorrect: true, answeredAt: "b" }] });
    expect(readQueue(USER.id)).toMatchObject([{ type: "estudo", deckId: "r1" }]);
  });
});

describe("camada de dados: correções da revisão", () => {
  it("sincronização que termina depois de sair não devolve as cópias ao aparelho", async () => {
    const { removeAccountCopies } = await import("./transfer");
    saveAccount(USER);
    setActiveAccount(USER);
    vi.mocked(api.getDeckChanges).mockRejectedValue(new RouteMissingError());
    let release: (v: unknown) => void = () => {};
    vi.mocked(api.getDecks).mockReturnValue(new Promise((r) => (release = r)) as never);
    vi.mocked(api.getDeck).mockResolvedValue(remote("r1", "t1"));

    setOnline(true);
    const sync = syncAccount();
    await Promise.resolve();
    // A pessoa sai e apaga enquanto a API ainda não respondeu (como o LogoutDialog faz)
    setActiveAccount(null);
    removeAccountCopies(USER.id);
    clearSavedAccount();
    release([{ ...remote("r1", "t1"), cards: undefined }]);
    await sync;

    expect(findLocalDeck("r1")).toBeNull();
    expect(getSavedAccount()).toBeNull();
  });

  it("estudo e edição com o id antigo da ficha usam o id novo", () => {
    setActiveAccount(USER);
    const copy = fromApiDeck(remote("r1", "t1"), USER.id);
    copy.cards[0] = { ...copy.cards[0], id: "novo", aliases: ["antigo"] };
    saveLocalDeck(copy);

    editCard("r1", "antigo", { question: "editada", answer: "r" });
    saveStudyResult("r1", { startedAt: "a", answers: [{ cardId: "antigo", wasCorrect: true, answeredAt: "b" }] });

    expect(findLocalDeck("r1")?.cards[0].question).toBe("editada");
    const items = readQueue(USER.id);
    expect(items[0]).toMatchObject({ type: "editarFicha", cardId: "novo" });
    expect(items[1]).toMatchObject({ type: "estudo", answers: [{ cardId: "novo" }] });
  });

  it("não cria cópia de um baralho que ainda está sendo levado para a conta", async () => {
    saveAccount(USER);
    setActiveAccount(USER);
    const device = fromApiDeck(remote("l1", "t1"), USER.id);
    saveLocalDeck({ ...device, kind: "aparelho", account: null, upload: { remoteId: "meio" } });
    vi.mocked(api.getDeckChanges).mockRejectedValue(new RouteMissingError());
    vi.mocked(api.getDecks).mockResolvedValue([{ ...remote("meio", "t1"), cards: undefined } as never]);
    vi.mocked(api.getDeck).mockResolvedValue(remote("meio", "t1"));

    setOnline(true);
    await syncAccount();

    expect(findLocalDeck("meio")).toBeNull();
  });

  it("ao voltar a internet: sessão em erro é restaurada; logada sincroniza", async () => {
    const { reconnectAction } = await import("./index");
    expect(reconnectAction("erro")).toBe("restaurar");
    expect(reconnectAction("logado")).toBe("sincronizar");
    expect(reconnectAction("deslogado")).toBe("nada");
  });
});

describe("camada de dados: pontos menores", () => {
  it("anúncio de falha chega com o tom de erro", async () => {
    const { announce, onSyncState } = await import("./index");
    let tone = "";
    const stop = onSyncState((s) => (tone = s.messageTone));
    announce("Não foi possível levar “Bio”.", "erro");
    stop();
    expect(tone).toBe("erro");
  });

  it("importar vários baralhos é tudo ou nada", async () => {
    const { createDecks } = await import("./index");
    const storage = await import("@/lib/local/storage");
    let writes = 0;
    const real = localStorage.setItem.bind(localStorage);
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation((k, v) => {
      if (k === "cardvoz.baralhos.v1" && ++writes === 2) throw new DOMException("cheio", "QuotaExceededError");
      real(k, v);
    });
    expect(() => createDecks([{ title: "A" }, { title: "B" }])).toThrow(storage.StorageFullError);
    spy.mockRestore();
    expect(listDecks()).toEqual([]);
  });
});

describe("acertos e erros na sincronização", () => {
  it("baralho estudado em outro aparelho é buscado de novo, mesmo sem outra mudança", async () => {
    saveAccount(USER);
    setActiveAccount(USER);
    saveLocalDeck(fromApiDeck({ ...remote("r1", "t1"), lastStudiedAt: "s1" }, USER.id));
    vi.mocked(api.getDeckChanges).mockRejectedValue(new RouteMissingError());
    vi.mocked(api.getDecks).mockResolvedValue([{ ...remote("r1", "t1"), lastStudiedAt: "s2", cards: undefined } as never]);
    const studied = remote("r1", "t1");
    studied.cards[0] = { ...studied.cards[0], correctCount: 0, incorrectCount: 1, lastWasCorrect: false, lastAnsweredAt: "s2" };
    vi.mocked(api.getDeck).mockResolvedValue({ ...studied, lastStudiedAt: "s2" });

    setOnline(true);
    await syncAccount();

    expect(api.getDeck).toHaveBeenCalledWith("r1");
    expect(findLocalDeck("r1")?.cards[0]).toMatchObject({ incorrectCount: 1, lastWasCorrect: false });
  });

  it("API sem os campos de acertos e erros não zera os números do aparelho", async () => {
    saveAccount(USER);
    setActiveAccount(USER);
    saveLocalDeck(fromApiDeck(remote("r1", "t1"), USER.id));
    saveStudyResult("r1", { startedAt: "a", answers: [{ cardId: "r1-c0", wasCorrect: false, answeredAt: "b" }] });
    // A fila foi enviada e a conta mudou (nome novo), mas a API ainda não manda os números
    vi.mocked(api.getDeckChanges).mockRejectedValue(new RouteMissingError());
    vi.mocked(api.completeStudySession).mockResolvedValue(undefined);
    vi.mocked(api.getDecks).mockResolvedValue([{ ...remote("r1", "t2"), cards: undefined } as never]);
    vi.mocked(api.getDeck).mockResolvedValue(remote("r1", "t2"));

    setOnline(true);
    await syncAccount();

    expect(findLocalDeck("r1")?.account?.remoteUpdatedAt).toBe("t2");
    expect(findLocalDeck("r1")?.cards[0]).toMatchObject({ incorrectCount: 1, lastWasCorrect: false });
  });
});

describe("idioma das fichas na camada de dados", () => {
  it("baralho do aparelho guarda o idioma só nele; o da conta também manda à conta", async () => {
    const { setDeckLanguages } = await import("./index");
    const device = createDeck({ title: "Inglês" });
    setDeckLanguages(device.id, { questionLang: "en", answerLang: null });
    expect(findLocalDeck(device.id)).toMatchObject({ questionLang: "en", answerLang: null });
    expect(readQueue(USER.id)).toHaveLength(0);

    setActiveAccount(USER);
    saveLocalDeck(fromApiDeck(remote("r1", "t1"), USER.id));
    setDeckLanguages("r1", { questionLang: "es", answerLang: null });
    setDeckLanguages("r1", { questionLang: "en", answerLang: null });
    // Só a escolha mais nova vai
    expect(readQueue(USER.id)).toMatchObject([{ type: "idiomaBaralho", deckId: "r1", questionLang: "en", answerLang: null }]);
  });

  it("API sem o campo de idioma não apaga o idioma escolhido no aparelho", async () => {
    const { setDeckLanguages } = await import("./index");
    saveAccount(USER);
    setActiveAccount(USER);
    saveLocalDeck(fromApiDeck(remote("r1", "t1"), USER.id));
    setDeckLanguages("r1", { questionLang: "en", answerLang: "pt-BR" });
    vi.mocked(api.updateDeck).mockResolvedValue(remote("r1", "t2") as never);
    vi.mocked(api.getDeckChanges).mockRejectedValue(new RouteMissingError());
    vi.mocked(api.getDecks).mockResolvedValue([{ ...remote("r1", "t2", 2), cards: undefined } as never]);
    vi.mocked(api.getDeck).mockResolvedValue(remote("r1", "t2", 2));

    setOnline(true);
    await syncAccount();

    expect(api.updateDeck).toHaveBeenCalledWith("r1", { questionLanguage: "en", answerLanguage: "pt-BR" });
    expect(findLocalDeck("r1")).toMatchObject({ questionLang: "en", answerLang: "pt-BR" });
    expect(findLocalDeck("r1")?.cards).toHaveLength(2);
  });

  it("API nova traz o idioma escolhido em outro aparelho (ausente = português)", async () => {
    saveAccount(USER);
    setActiveAccount(USER);
    saveLocalDeck({ ...fromApiDeck(remote("r1", "t1"), USER.id), questionLang: "es" });
    const novo = remote("r1", "t2");
    novo.cards[0] = { ...novo.cards[0], reviewLevel: 0 };
    vi.mocked(api.getDeckChanges).mockRejectedValue(new RouteMissingError());
    vi.mocked(api.getDecks).mockResolvedValue([{ ...novo, answerLanguage: "en", cards: undefined } as never]);
    vi.mocked(api.getDeck).mockResolvedValue({ ...novo, answerLanguage: "en" });

    setOnline(true);
    await syncAccount();

    expect(findLocalDeck("r1")).toMatchObject({ questionLang: null, answerLang: "en" });
  });
});
