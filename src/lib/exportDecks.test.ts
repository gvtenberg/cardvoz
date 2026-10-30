import { describe, expect, it } from "vitest";
import { exportFileName, toExported } from "./exportDecks";
import { parseImportText } from "./importCards";

const bio = { title: "Biologia Celular", cards: [{ question: "q1", answer: "r1" }, { question: "q2", answer: "r2" }] };
const ing = { title: "Inglês", cards: [{ question: "go", answer: "went" }] };

describe("exportar baralhos", () => {
  it("mantém a ordem das fichas no formato da importação", () => {
    expect(toExported(bio)).toEqual({
      titulo: "Biologia Celular",
      fichas: [
        { pergunta: "q1", resposta: "r1" },
        { pergunta: "q2", resposta: "r2" },
      ],
    });
  });

  it("gera nomes de arquivo sem acentos nem espaços", () => {
    const day = new Date(2026, 9, 30);
    expect(exportFileName("Biologia Celular", day)).toBe("cardvoz-biologia-celular.json");
    expect(exportFileName("Inglês: verbos!", day)).toBe("cardvoz-ingles-verbos.json");
    expect(exportFileName(null, day)).toBe("cardvoz-baralhos-2026-10-30.json");
  });

  it("um arquivo com todos os baralhos volta como vários baralhos", () => {
    const text = JSON.stringify([toExported(bio), toExported(ing)]);
    const result = parseImportText(text, "cardvoz-baralhos.json");
    expect(result.decks?.map((d) => d.title)).toEqual(["Biologia Celular", "Inglês"]);
    expect(result.decks?.[0].cards).toEqual(bio.cards);
    expect(result.cards).toHaveLength(3);
  });

  it("uma lista de fichas continua sendo um baralho só", () => {
    const text = JSON.stringify([{ pergunta: "a", resposta: "b" }]);
    const result = parseImportText(text, "fichas.json");
    expect(result.decks).toBeUndefined();
    expect(result.cards).toEqual([{ question: "a", answer: "b" }]);
  });
});
