import { describe, expect, it } from "vitest";
import { routes, safeRedirect } from "./routes";

describe("safeRedirect", () => {
  it("aceita caminhos internos, com busca e âncora", () => {
    expect(safeRedirect("/perfil/")).toBe("/perfil/");
    expect(safeRedirect("/baralho/?id=bio")).toBe("/baralho/?id=bio");
    expect(safeRedirect("/baralhos/novo/#importar")).toBe("/baralhos/novo/#importar");
  });

  it("manda para a lista quando não há endereço", () => {
    expect(safeRedirect(null)).toBe(routes.decks);
    expect(safeRedirect("")).toBe(routes.decks);
  });

  it("recusa endereços de outros sites", () => {
    for (const voltar of [
      "https://site-falso.com",
      "//site-falso.com",
      "/\\site-falso.com",
      "javascript:alert(1)",
      "perfil/",
    ]) {
      expect(safeRedirect(voltar)).toBe(routes.decks);
    }
  });

  it("recusa tab e quebra de linha, que o navegador apaga antes de ler a URL", () => {
    for (const voltar of ["/\t/site-falso.com", "/\n/site-falso.com", "/\r\\site-falso.com", "/ /x"]) {
      expect(safeRedirect(voltar)).toBe(routes.decks);
    }
  });
});
