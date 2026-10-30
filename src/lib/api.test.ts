import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteMissingError, getDeckChanges } from "./api";

afterEach(() => vi.unstubAllGlobals());

describe("rotas novas da API", () => {
  it("resposta com outro formato (baralho com endereço 'changes') conta como rota ausente", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ id: "x", slug: "changes", title: "Changes", cards: [] }), { status: 200 })
      )
    );
    await expect(getDeckChanges(null)).rejects.toBeInstanceOf(RouteMissingError);
  });
});
