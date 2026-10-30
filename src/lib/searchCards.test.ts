import { describe, expect, it } from "vitest";
import { filterCards, resultsText } from "./searchCards";

const cards = [
  { id: "1", question: "Qual organela produz energia?", answer: "A mitocôndria." },
  { id: "2", question: "Passado de 'to go'", answer: "Went" },
  { id: "3", question: "Função do ribossomo", answer: "Produzir proteínas" },
];

describe("busca de fichas", () => {
  it("acha na pergunta e na resposta, sem diferenciar acentos nem maiúsculas", () => {
    expect(filterCards(cards, "MITOCONDRIA").map((c) => c.id)).toEqual(["1"]);
    expect(filterCards(cards, "produ").map((c) => c.id)).toEqual(["1", "3"]);
  });

  it("busca vazia devolve tudo", () => {
    expect(filterCards(cards, "   ")).toHaveLength(3);
  });

  it("descreve o resultado para o leitor de tela", () => {
    expect(resultsText(0, "xyz")).toBe("Nenhuma ficha encontrada para “xyz”.");
    expect(resultsText(1, "went")).toBe("1 ficha encontrada.");
    expect(resultsText(2, "produ")).toBe("2 fichas encontradas.");
  });
});

describe("idiomas", () => {
  it("só marca lang quando o idioma não é o da página", async () => {
    const { langAttr, languageName } = await import("./languages");
    expect(langAttr("en")).toBe("en");
    expect(langAttr("pt-BR")).toBeUndefined();
    expect(langAttr(null)).toBeUndefined();
    expect(languageName(null)).toBe("Português");
    expect(languageName("en")).toBe("Inglês");
  });
});
