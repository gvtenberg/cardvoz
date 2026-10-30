import { describe, expect, it, vi } from "vitest";
import { ApiError, RouteMissingError, type DeckDetailResponse } from "@/lib/api";
import { findLocalDeck, listLocalDecks, saveLocalDeck, type LocalDeck } from "@/lib/local/decks";
import { enqueue, pendingCount } from "@/lib/local/queue";
import {
  convertCopiesToDevice,
  findDuplicate,
  relinkUnchanged,
  removeAccountCopies,
  transferDeck,
  uploadCandidates,
  type TransferApi,
} from "./transfer";

const USER = "u1";

function deck(id: string, change: Partial<LocalDeck> = {}): LocalDeck {
  const d: LocalDeck = {
    id,
    aliases: [],
    title: "Biologia",
    category: "Geral",
    description: null,
    sourceDeckId: null,
    createdAt: "2026-10-30T00:00:00Z",
    updatedAt: "2026-10-30T00:00:00Z",
    cards: ["a", "b", "c", "d", "e"].map((q, i) => ({
      id: `${id}-${q}`, question: q, answer: "r", displayOrder: i + 1, createdAt: "x",
    })),
    kind: "aparelho",
    account: null,
    editedOffAccount: false,
    upload: null,
    ...change,
  };
  saveLocalDeck(d);
  return d;
}

function remote(id: string, questions: string[], title = "Biologia"): DeckDetailResponse {
  return {
    id, slug: id, title, category: "Geral", cardCount: questions.length, createdAt: "x", updatedAt: "t",
    cards: questions.map((q, i) => ({ id: `${id}-r${i}`, deckId: id, question: q, answer: "r", displayOrder: i + 1, createdAt: "x" })),
  };
}

function fakeApi() {
  return {
    importDeck: vi.fn().mockRejectedValue(new RouteMissingError()),
    createDeck: vi.fn().mockResolvedValue({ id: "novo", slug: "novo", title: "Biologia", category: "Geral", cardCount: 0, createdAt: "x" }),
    createCard: vi.fn().mockImplementation(async (c) => ({ ...c, id: `id-${c.question}`, createdAt: "x" })),
    getDeck: vi.fn().mockResolvedValue(remote("novo", ["a", "b", "c", "d", "e"])),
    deleteDeck: vi.fn().mockResolvedValue(undefined),
  } satisfies Record<keyof TransferApi, unknown>;
}

const fromAccount = (remoteId: string) => ({ userId: USER, remoteId, remoteUpdatedAt: "t" });

describe("levar para a conta", () => {
  it("religa só os baralhos da mesma conta que não foram editados", () => {
    deck("r1", { account: fromAccount("r1") });
    deck("r2", { account: fromAccount("r2"), editedOffAccount: true });
    deck("r3", { account: { ...fromAccount("r3"), userId: "outra" } });
    deck("l1");

    expect(relinkUnchanged(USER)).toBe(1);
    expect(findLocalDeck("r1")?.kind).toBe("conta");
    expect(uploadCandidates(USER).map((d) => d.id).sort()).toEqual(["l1", "r2", "r3"]);
  });

  it("acha repetido pela origem e pelo nome, sem diferenciar maiúsculas", () => {
    const edited = deck("r2", { account: fromAccount("r2"), editedOffAccount: true });
    expect(findDuplicate(edited, USER)).toMatchObject({ remoteId: "r2" });

    deck("c1", { kind: "conta", account: fromAccount("c1"), title: "Biologia" });
    const local = deck("l1", { title: "biologia " });
    expect(findDuplicate(local, USER)).toMatchObject({ remoteId: "c1", remoteTitle: "Biologia" });

    const other = deck("l2", { title: "Química" });
    expect(findDuplicate(other, USER)).toBeNull();
  });

  it("sem a rota nova, cria o baralho e as fichas em ordem e vira cópia da conta", async () => {
    const local = deck("l1");
    const api = fakeApi();

    await transferDeck(local, "levar", USER, api, null);

    expect(api.createDeck).toHaveBeenCalledWith({ title: "Biologia", category: "Geral" });
    expect(api.createCard.mock.calls.map((c) => c[0].question)).toEqual(["a", "b", "c", "d", "e"]);
    const moved = findLocalDeck("l1");
    expect(moved?.id).toBe("novo");
    expect(moved?.kind).toBe("conta");
    expect(moved?.aliases).toContain("l1");
  });

  it("retoma um envio interrompido sem criar o baralho de novo", async () => {
    const local = deck("l1", { upload: { remoteId: "novo" } });
    const api = fakeApi();
    api.getDeck
      .mockResolvedValueOnce(remote("novo", ["a", "b"]))
      .mockResolvedValueOnce(remote("novo", ["a", "b", "c", "d", "e"]));

    await transferDeck(local, "levar", USER, api, null);

    expect(api.createDeck).not.toHaveBeenCalled();
    expect(api.importDeck).not.toHaveBeenCalled();
    expect(api.createCard.mock.calls.map((c) => [c[0].question, c[0].displayOrder])).toEqual([
      ["c", 3], ["d", 4], ["e", 5],
    ]);
  });

  it("guarda o id da conta antes das fichas, para retomar se cair a internet", async () => {
    const local = deck("l1");
    const api = fakeApi();
    api.createCard.mockRejectedValueOnce(new ApiError(0, "sem internet"));

    await expect(transferDeck(local, "levar", USER, api, null)).rejects.toThrow();
    expect(findLocalDeck("l1")?.upload).toEqual({ remoteId: "novo" });
  });

  it("manter os dois leva com o nome do aparelho", async () => {
    const local = deck("l1");
    const api = fakeApi();
    await transferDeck(local, "manterDois", USER, api, { remoteId: "c1", remoteTitle: "Biologia" });
    expect(api.createDeck).toHaveBeenCalledWith({ title: "Biologia (do aparelho)", category: "Geral" });
  });

  it("ficar com o do aparelho apaga o da conta antes de levar", async () => {
    deck("c1", { kind: "conta", account: fromAccount("c1") });
    const local = deck("l1");
    const api = fakeApi();
    await transferDeck(local, "ficarAparelho", USER, api, { remoteId: "c1", remoteTitle: "Biologia" });
    expect(api.deleteDeck).toHaveBeenCalledWith("c1");
    expect(api.deleteDeck.mock.invocationCallOrder[0]).toBeLessThan(api.createDeck.mock.invocationCallOrder[0]);
    expect(findLocalDeck("c1")).toBeNull();
  });

  it("ficar com o da conta descarta o do aparelho", async () => {
    const local = deck("l1");
    const api = fakeApi();
    api.getDeck.mockResolvedValue(remote("c1", ["x"]));
    await transferDeck(local, "ficarConta", USER, api, { remoteId: "c1", remoteTitle: "Biologia" });
    expect(findLocalDeck("l1")).toBeNull();
    expect(findLocalDeck("c1")?.kind).toBe("conta");
    expect(api.createDeck).not.toHaveBeenCalled();
  });
});

describe("sair da conta", () => {
  it("manter: as cópias viram do aparelho; as com alteração pendente ficam marcadas", () => {
    deck("c1", { kind: "conta", account: fromAccount("c1") });
    deck("c2", { kind: "conta", account: fromAccount("c2") });
    enqueue(USER, { type: "renomearBaralho", deckId: "c2", title: "x" });

    convertCopiesToDevice(USER);

    expect(findLocalDeck("c1")).toMatchObject({ kind: "aparelho", editedOffAccount: false, account: { remoteId: "c1" } });
    expect(findLocalDeck("c2")?.editedOffAccount).toBe(true);
    expect(pendingCount(USER)).toBe(0);
  });

  it("apagar: some com as cópias, mas guarda o que nunca chegou à conta", () => {
    deck("c1", { kind: "conta", account: fromAccount("c1") });
    deck("novo-offline", { kind: "conta", account: { userId: USER, remoteId: "", remoteUpdatedAt: null } });
    deck("l1");

    removeAccountCopies(USER);

    expect(listLocalDecks().map((d) => d.id).sort()).toEqual(["l1", "novo-offline"]);
    expect(findLocalDeck("novo-offline")).toMatchObject({ kind: "aparelho", account: null });
  });
});
