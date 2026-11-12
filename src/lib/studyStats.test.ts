import { describe, expect, it } from "vitest";
import { applyAnswers, deckStats, deckStatsText, missedCards, statsPayload, type CardStats } from "./studyStats";

const card = (id: string, extra: CardStats & { aliases?: string[] } = {}): CardStats & { id: string; question: string; aliases?: string[] } => ({
  id,
  question: id,
  ...extra,
});

describe("acertos e erros das fichas", () => {
  it("soma as respostas da rodada e guarda a mais recente de cada ficha", () => {
    const cards = applyAnswers([card("a"), card("b"), card("c")], [
      { cardId: "a", wasCorrect: false, answeredAt: "2026-11-11T10:00:00Z" },
      { cardId: "b", wasCorrect: true, answeredAt: "2026-11-11T10:01:00Z" },
      { cardId: "a", wasCorrect: true, answeredAt: "2026-11-11T10:02:00Z" },
    ]);
    expect(cards[0]).toMatchObject({ correctCount: 1, incorrectCount: 1, lastWasCorrect: true });
    expect(cards[1]).toMatchObject({ correctCount: 1, incorrectCount: 0, lastWasCorrect: true });
    expect(cards[2]).toEqual(card("c"));
  });

  it("acha a ficha pelo id antigo (antes de a fila enviar)", () => {
    const [c] = applyAnswers([card("novo", { aliases: ["velho"] })], [
      { cardId: "velho", wasCorrect: false, answeredAt: "t" },
    ]);
    expect(c).toMatchObject({ incorrectCount: 1, lastWasCorrect: false });
  });

  it("resposta mais antiga soma, mas não troca a última", () => {
    const [c] = applyAnswers(
      [card("a", { correctCount: 2, incorrectCount: 0, lastAnsweredAt: "2026-11-11T10:00:00Z", lastWasCorrect: true })],
      [{ cardId: "a", wasCorrect: false, answeredAt: "2026-11-01T10:00:00Z" }]
    );
    expect(c).toMatchObject({ correctCount: 2, incorrectCount: 1, lastWasCorrect: true });
  });

  it("só as erradas na última vez entram em Estudar só as que errei", () => {
    const cards = [
      card("a", { lastWasCorrect: false }),
      card("b", { lastWasCorrect: true }),
      card("c"),
      card("d", { lastWasCorrect: false }),
    ];
    expect(missedCards(cards).map((c) => c.id)).toEqual(["a", "d"]);
  });

  it("monta a frase do baralho, que se explica sozinha", () => {
    expect(deckStatsText(deckStats([card("a")]))).toBeNull();
    const stats = deckStats([
      card("a", { correctCount: 3, incorrectCount: 1, lastWasCorrect: false }),
      card("b", { correctCount: 1, incorrectCount: 0, lastWasCorrect: true }),
    ]);
    expect(stats).toEqual({ correct: 4, incorrect: 1, studiedCards: 2, missed: 1 });
    expect(deckStatsText(stats)).toBe(
      "No total, 4 acertos e 1 erro. 1 ficha para revisar: você errou na última vez."
    );
    expect(deckStatsText(deckStats([card("b", { correctCount: 1, lastWasCorrect: true })]))).toBe(
      "No total, 1 acerto e 0 erros. Nenhuma ficha para revisar."
    );
  });

  it("para a API, manda só o que existe", () => {
    expect(statsPayload(card("a"))).toEqual({});
    expect(statsPayload(card("a", { correctCount: 1, incorrectCount: 2 }))).toEqual({
      correctCount: 1,
      incorrectCount: 2,
    });
    expect(
      statsPayload(card("a", { correctCount: 1, incorrectCount: 0, lastAnsweredAt: "t", lastWasCorrect: true }))
    ).toEqual({ correctCount: 1, incorrectCount: 0, lastAnsweredAt: "t", lastWasCorrect: true });
  });
});
