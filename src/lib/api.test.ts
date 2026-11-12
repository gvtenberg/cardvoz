import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getDeckChanges, importDeck } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("rotas da parte 4", () => {
  it("lê as alterações da conta numa chamada", async () => {
    const body = { decks: [], allIds: ["a"], serverTime: "2026-11-13T00:00:00Z" };
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getDeckChanges("2026-11-12T00:00:00Z")).resolves.toEqual(body);
    expect(String(fetchMock.mock.calls[0][0])).toContain("/decks/changes?since=2026-11-12T00%3A00%3A00Z");
  });

  it("erro da API vira ApiError (não há mais caminho antigo)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: "x" }), { status: 404 })));
    await expect(importDeck({ title: "a", category: "Geral", cards: [] })).rejects.toBeInstanceOf(ApiError);
  });
});
