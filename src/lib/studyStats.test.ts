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
      reviewEase: 2500,
      nextReviewAt: "t",
    });
  });
});

// Os mesmos casos e números de CardTests.cs, na API: as duas contas precisam dar o mesmo resultado
describe("revisão espaçada no estilo do Anki", () => {
  const T0 = "2026-11-12T10:00:00.000Z";
  const HOUR = 3600000;
  const at = (days: number, extraMs = 0) => new Date(Date.parse(T0) + days * 86400000 + extraMs).toISOString();
  /** Ficha em revisão: intervalo, facilidade e última resposta em T0 */
  const inReview = (days: number, ease = 2500) =>
    card("a", { correctCount: 1, lastAnsweredAt: T0, lastWasCorrect: true, reviewEase: ease, nextReviewAt: at(days) });
  /** Intervalo em vigor: os dias entre a última resposta e a próxima revisão */
  const interval = (c: CardStats) => reviewState(c).intervalDays;
  const answer = (c: ReturnType<typeof card>, wasCorrect: boolean, when: string) =>
    applyAnswers([c], [{ cardId: "a", wasCorrect, answeredAt: when }])[0];

  it("Acertei na data multiplica o intervalo pela facilidade, até 1 ano", () => {
    let c = card("a");
    let when = T0;
    for (const expected of [1, 3, 8, 20, 50, 125, 313, 365, 365]) {
      c = answer(c, true, when);
      expect(interval(c)).toBe(expected);
      expect(c.nextReviewAt).toBe(addDays(when, expected));
      when = c.nextReviewAt!;
    }
    expect(c).toMatchObject({ correctCount: 9, reviewEase: 2500 });
  });

  it("Errei volta para revisar na hora e baixa a facilidade uma vez", () => {
    let c = answer(inReview(8), false, at(8));
    expect(c).toMatchObject({ reviewEase: 2300, nextReviewAt: at(8), lastWasCorrect: false });
    expect(interval(c)).toBe(0);

    // Errar de novo antes de acertar não baixa a facilidade outra vez
    c = answer(c, false, at(8, 5 * 60000));
    expect(c).toMatchObject({ reviewEase: 2300, incorrectCount: 2 });

    // Acertou: recomeça em 1 dia e cresce mais devagar (1 × 2,3 = 2; 2 × 2,3 = 5)
    c = answer(c, true, at(9));
    expect(interval(c)).toBe(1);
    c = answer(c, true, at(10));
    expect(interval(c)).toBe(2);
    c = answer(c, true, at(12));
    expect(interval(c)).toBe(5);
  });

  it("a facilidade não passa do mínimo", () => {
    let c = card("a");
    let when = T0;
    for (let i = 0; i < 8; i++) {
      c = answer(c, true, when);
      when = c.nextReviewAt!;
      c = answer(c, false, when);
    }
    expect(c.reviewEase).toBe(1300);
  });

  it("Acertei atrasado conta metade do atraso", () => {
    // 10 dias de intervalo, respondida 10 dias depois da data: (10 + 5) × 2,5 = 37,5
    expect(answer(inReview(10), true, at(20)).nextReviewAt).toBe(at(58));
  });

  it("Acertei antes da data conta só o tempo que passou", () => {
    // 2 dias depois, de 10: 2 × 2,5 = 5, menor que o intervalo, que não encolhe
    expect(answer(inReview(10), true, at(2)).nextReviewAt).toBe(at(12));
    // 8 dias depois, de 10: 8 × 2,5 = 20
    expect(interval(answer(inReview(10), true, at(8)))).toBe(20);

    // Mesma ficha duas vezes no mesmo dia: o intervalo não cresce
    const twice = answer(answer(card("a"), true, T0), true, at(0, HOUR));
    expect(twice.nextReviewAt).toBe(at(0, 25 * HOUR));

    // Estudo diário um pouco antes de completar 24 horas ainda avança: 23 h × 2,5 = 2,4 dias
    expect(interval(answer(answer(card("a"), true, T0), true, at(0, 23 * HOUR)))).toBe(2);
  });

  it("resposta antiga soma, mas não troca a última nem a revisão", () => {
    const c = answer(answer(card("a"), true, T0), false, at(-5));
    expect(c).toMatchObject({ nextReviewAt: at(1), reviewEase: 2500, lastWasCorrect: true, incorrectCount: 1 });
  });

  it("entra em Revisar agora quando chega a data; nunca estudada não entra", () => {
    const cards = [
      card("errada", { lastAnsweredAt: T0, lastWasCorrect: false }),
      card("amanha", { lastAnsweredAt: T0, lastWasCorrect: true, nextReviewAt: at(1) }),
      card("nova"),
    ];
    expect(dueCards(cards, Date.parse(at(0.5))).map((c) => c.id)).toEqual(["errada"]);
    expect(dueCards(cards, Date.parse(at(1))).map((c) => c.id)).toEqual(["errada", "amanha"]);
  });

  it("ficha guardada pelas versões anteriores ganha o que dá para deduzir", () => {
    // Só a última resposta (antes da revisão espaçada)
    expect(reviewState(card("a", { lastAnsweredAt: T0, lastWasCorrect: true }))).toEqual({ intervalDays: 1, ease: 2500, nextReviewAt: at(1) });
    expect(reviewState(card("b", { lastAnsweredAt: T0, lastWasCorrect: false }))).toEqual({ intervalDays: 0, ease: 2500, nextReviewAt: T0 });
    expect(reviewState(card("c"))).toEqual({ intervalDays: 0, ease: 2500, nextReviewAt: null });
    // Caixa de Leitner (0.10 a 0.14): nível e data; o intervalo sai das datas
    const leitner = { lastAnsweredAt: T0, lastWasCorrect: true, reviewLevel: 3, nextReviewAt: at(7) } as CardStats;
    expect(reviewState(card("d", leitner))).toEqual({ intervalDays: 7, ease: 2500, nextReviewAt: at(7) });
    // E a ficha continua de onde estava: 7 dias na data viram 7 × 2,5 = 17,5
    expect(interval(answer(card("a", leitner), true, at(7)))).toBe(18);
  });

  it("valores estragados no aparelho não quebram a conta", () => {
    const broken = card("a", { lastAnsweredAt: T0, lastWasCorrect: true, reviewEase: 50, nextReviewAt: "x" });
    expect(reviewState(broken)).toMatchObject({ intervalDays: 1, ease: 1300 });
    expect(answer(broken, true, at(1)).nextReviewAt).toBe(at(2));
    // Próxima revisão a anos da última resposta: o intervalo fica em 1 ano
    const far = card("a", { lastAnsweredAt: T0, lastWasCorrect: true, nextReviewAt: at(5000) });
    expect(interval(far)).toBe(365);
  });
});

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 86400000).toISOString();
}
