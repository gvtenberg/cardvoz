import { describe, expect, it } from "vitest";
import {
  DECKS_KEY,
  findLocalDeck,
  fromApiDeck,
  listLocalDecks,
  newDeviceDeck,
  saveLocalDeck,
  toDeckResponse,
  type LocalDeck,
} from "./decks";
import type { DeckDetailResponse } from "@/lib/api";

describe("baralhos no aparelho", () => {
  it("cria um baralho do aparelho com as fichas em ordem", () => {
    const deck = newDeviceDeck({ title: "Bio", cards: [{ question: "a", answer: "b" }] });
    expect(deck.kind).toBe("aparelho");
    expect(deck.category).toBe("Geral");
    expect(deck.cards[0].displayOrder).toBe(1);
    expect(findLocalDeck(deck.id)?.title).toBe("Bio");
  });

  it("acha o baralho por um id antigo", () => {
    const deck = newDeviceDeck({ title: "Bio" });
    saveLocalDeck({ ...deck, aliases: ["antigo"] });
    expect(findLocalDeck("antigo")?.id).toBe(deck.id);
  });

  it("não apaga o que outra aba gravou ao salvar", () => {
    const a = newDeviceDeck({ title: "A" });
    // Outra aba grava B direto no armazenamento
    const b: LocalDeck = { ...a, id: "outra-aba", title: "B" };
    const stored = JSON.parse(localStorage.getItem(DECKS_KEY) as string) as LocalDeck[];
    localStorage.setItem(DECKS_KEY, JSON.stringify([...stored, b]));

    saveLocalDeck({ ...a, title: "A editado" });

    const titles = listLocalDecks().map((d) => d.title).sort();
    expect(titles).toEqual(["A editado", "B"]);
  });

  it("converte um baralho da API em cópia da conta", () => {
    const api: DeckDetailResponse = {
      id: "r1",
      slug: "bio",
      title: "Bio",
      category: "Geral",
      cardCount: 2,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-02T00:00:00Z",
      cards: [
        { id: "c2", deckId: "r1", question: "q2", answer: "a2", displayOrder: 2, createdAt: "x" },
        { id: "c1", deckId: "r1", question: "q1", answer: "a1", displayOrder: 1, createdAt: "x" },
      ],
    };
    const local = fromApiDeck(api, "u1");
    expect(local.id).toBe("r1");
    expect(local.kind).toBe("conta");
    expect(local.cards.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(local.account).toEqual({ userId: "u1", remoteId: "r1", remoteUpdatedAt: "2026-10-02T00:00:00Z" });
  });

  it("expõe o baralho no formato das páginas", () => {
    const deck = newDeviceDeck({ title: "Bio", cards: [{ question: "a", answer: "b" }] });
    const response = toDeckResponse(deck);
    expect(response.cardCount).toBe(1);
    expect(response.slug).toBe(deck.id);
    expect(response.kind).toBe("aparelho");
  });

  it("descarta itens inválidos sem perder os outros", () => {
    const ok = newDeviceDeck({ title: "Ok" });
    const stored = JSON.parse(localStorage.getItem(DECKS_KEY) as string);
    localStorage.setItem(DECKS_KEY, JSON.stringify([...stored, { id: "x", title: "sem fichas" }]));
    expect(listLocalDecks().map((d) => d.id)).toEqual([ok.id]);
  });

  it("guarda uma cópia quando descarta um baralho inválido", () => {
    newDeviceDeck({ title: "Ok" });
    const stored = JSON.parse(localStorage.getItem(DECKS_KEY) as string);
    const raw = JSON.stringify([...stored, { id: "x", title: "sem fichas" }]);
    localStorage.setItem(DECKS_KEY, raw);
    listLocalDecks();
    expect(localStorage.getItem(`${DECKS_KEY}.corrompido`)).toBe(raw);
  });
});
