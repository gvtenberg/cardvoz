import { describe, expect, it } from "vitest";
import {
  applyAnswers,
  deckStats,
  deckStatsText,
  dueCards,
  missedCards,
  reviewState,
  statsPayload,
  type CardStats,
} from "./studyStats";

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

  it("só as erradas na última vez contam como erradas", () => {
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
    expect(stats).toEqual({ correct: 4, incorrect: 1, studiedCards: 2, missed: 1, due: 0 });
    // Sem data da última resposta, a ficha errada não entra na revisão (dado incompleto)
    const withDates = deckStats([
      card("a", { correctCount: 3, incorrectCount: 1, lastWasCorrect: false, lastAnsweredAt: "2026-11-01T00:00:00Z" }),
    ]);
    expect(deckStatsText(withDates)).toBe("No total, 3 acertos e 1 erro. 1 ficha para revisar agora.");
    expect(deckStatsText(deckStats([card("b", { correctCount: 1, lastWasCorrect: true })]))).toBe(
      "No total, 1 acerto e 0 erros. Nenhuma ficha para revisar agora."
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
    ).toEqual({
      correctCount: 1,
      incorrectCount: 0,
      lastAnsweredAt: "t",
      lastWasCorrect: true,
      reviewLevel: 1,
      nextReviewAt: "t",
    });
  });
});

describe("revisão espaçada (caixa de Leitner)", () => {
  const T0 = "2026-11-12T10:00:00.000Z";
  const at = (days: number) => new Date(Date.parse(T0) + days * 86400000).toISOString();

  it("cada Acertei sobe um nível e afasta a revisão; Errei volta para a hora", () => {
    let [c] = [card("a")];
    const answer = (wasCorrect: boolean, when: string) => {
      [c] = applyAnswers([c], [{ cardId: "a", wasCorrect, answeredAt: when }]);
      return c;
    };
    expect(answer(true, T0)).toMatchObject({ reviewLevel: 1, nextReviewAt: at(1) });
    expect(answer(true, at(1))).toMatchObject({ reviewLevel: 2, nextReviewAt: at(4) });
    expect(answer(true, at(4))).toMatchObject({ reviewLevel: 3, nextReviewAt: at(11) });
    expect(answer(true, at(11))).toMatchObject({ reviewLevel: 4, nextReviewAt: at(25) });
    expect(answer(true, at(25))).toMatchObject({ reviewLevel: 5, nextReviewAt: at(55) });
    expect(answer(true, at(55))).toMatchObject({ reviewLevel: 6, nextReviewAt: at(145) });
    expect(answer(true, at(145))).toMatchObject({ reviewLevel: 6, nextReviewAt: at(235) });
    expect(answer(false, at(235))).toMatchObject({ reviewLevel: 0, nextReviewAt: at(235) });
  });

  it("entra em Revisar agora quando chega a data; nunca estudada não entra", () => {
    const cards = [
      card("errada", { lastAnsweredAt: T0, lastWasCorrect: false }),
      card("amanha", { lastAnsweredAt: T0, lastWasCorrect: true, reviewLevel: 1, nextReviewAt: at(1) }),
      card("nova"),
    ];
    expect(dueCards(cards, Date.parse(at(0.5))).map((c) => c.id)).toEqual(["errada"]);
    expect(dueCards(cards, Date.parse(at(1))).map((c) => c.id)).toEqual(["errada", "amanha"]);
  });

  it("ficha guardada antes da revisão espaçada ganha o nível que dá para deduzir", () => {
    expect(reviewState(card("a", { lastAnsweredAt: T0, lastWasCorrect: true }))).toEqual({ level: 1, nextReviewAt: at(1) });
    expect(reviewState(card("b", { lastAnsweredAt: T0, lastWasCorrect: false }))).toEqual({ level: 0, nextReviewAt: T0 });
    expect(reviewState(card("c"))).toEqual({ level: 0, nextReviewAt: null });
  });
});
