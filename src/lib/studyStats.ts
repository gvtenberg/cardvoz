/**
 * Acertos, erros e revisão espaçada de cada ficha e do baralho.
 *
 * Cada ficha guarda quantas vezes foi respondida com "Acertei" e com "Errei",
 * a resposta mais recente e o nível na caixa de Leitner (0 a 6). "Errei" volta
 * a ficha ao nível 0 (revisar na hora); cada "Acertei" sobe um nível e afasta a
 * próxima revisão. A API usa a mesma tabela (Card.ReviewIntervals): mude as duas.
 */

export interface CardStats {
  correctCount?: number;
  incorrectCount?: number;
  /** Quando a ficha foi respondida pela última vez (ISO); ausente = nunca */
  lastAnsweredAt?: string | null;
  lastWasCorrect?: boolean | null;
  /** Revisão espaçada: nível de 0 a 6 */
  reviewLevel?: number;
  /** Quando a ficha volta para "Revisar agora" (ISO); ausente = nunca estudada */
  nextReviewAt?: string | null;
}

export const MAX_REVIEW_LEVEL = 6;
const DAY = 24 * 60 * 60 * 1000;
/** Espera em cada nível: na hora, 1 dia, 3 dias, 1 semana, 2 semanas, 1 mês, 3 meses */
export const REVIEW_INTERVALS_MS = [0, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY, 90 * DAY];

/** Data + espera. Data inválida (dado estragado no aparelho) fica como está, sem quebrar a tela. */
function addMs(iso: string, ms: number): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? iso : new Date(time + ms).toISOString();
}

/**
 * Nível e próxima revisão da ficha. Fichas guardadas antes da revisão espaçada
 * (só com a última resposta) ganham o que dá para deduzir: errou = revisar na
 * hora; acertou = nível 1, revisar 1 dia depois.
 */
export function reviewState(card: CardStats): { level: number; nextReviewAt: string | null } {
  if (card.nextReviewAt) return { level: card.reviewLevel ?? 0, nextReviewAt: card.nextReviewAt };
  if (!card.lastAnsweredAt || typeof card.lastWasCorrect !== "boolean") return { level: 0, nextReviewAt: null };
  const level = card.lastWasCorrect ? Math.max(card.reviewLevel ?? 1, 1) : 0;
  return { level, nextReviewAt: addMs(card.lastAnsweredAt, REVIEW_INTERVALS_MS[level]) };
}

/** A ficha já foi estudada e chegou a hora de revisar. */
export function isDue(card: CardStats, now = Date.now()): boolean {
  const { nextReviewAt } = reviewState(card);
  return nextReviewAt !== null && new Date(nextReviewAt).getTime() <= now;
}

/** Fichas para "Revisar agora", na ordem do baralho (as erradas na última vez entram sempre). */
export function dueCards<T extends CardStats>(cards: T[], now = Date.now()): T[] {
  return cards.filter((c) => isDue(c, now));
}

export interface StudyAnswer {
  cardId: string;
  wasCorrect: boolean;
  answeredAt: string;
}

/** Soma as respostas de uma rodada nas fichas (as que não foram respondidas ficam iguais). */
export function applyAnswers<T extends CardStats & { id: string; aliases?: string[] }>(
  cards: T[],
  answers: StudyAnswer[]
): T[] {
  return cards.map((card) => {
    const mine = answers.filter((a) => a.cardId === card.id || card.aliases?.includes(a.cardId));
    if (mine.length === 0) return card;
    const correct = mine.filter((a) => a.wasCorrect).length;
    const last = mine.reduce((a, b) => (b.answeredAt >= a.answeredAt ? b : a));
    // Resposta antiga (de outro aparelho, por ex.) não troca a mais recente nem o nível
    const isNewer = !card.lastAnsweredAt || last.answeredAt >= card.lastAnsweredAt;
    const before = reviewState(card).level;
    const level = last.wasCorrect ? Math.min(before + 1, MAX_REVIEW_LEVEL) : 0;
    return {
      ...card,
      correctCount: (card.correctCount ?? 0) + correct,
      incorrectCount: (card.incorrectCount ?? 0) + mine.length - correct,
      lastAnsweredAt: isNewer ? last.answeredAt : card.lastAnsweredAt,
      lastWasCorrect: isNewer ? last.wasCorrect : card.lastWasCorrect,
      reviewLevel: isNewer ? level : card.reviewLevel,
      nextReviewAt: isNewer ? addMs(last.answeredAt, REVIEW_INTERVALS_MS[level]) : card.nextReviewAt,
    };
  });
}

/** Fichas cuja resposta mais recente foi "Errei", na ordem do baralho. */
export function missedCards<T extends CardStats>(cards: T[]): T[] {
  return cards.filter((c) => c.lastWasCorrect === false);
}

export interface DeckStats {
  correct: number;
  incorrect: number;
  /** Fichas respondidas pelo menos uma vez */
  studiedCards: number;
  /** Fichas que a pessoa errou na última vez */
  missed: number;
  /** Fichas para "Revisar agora" (erradas e as que chegaram na data de revisão) */
  due: number;
}

export function deckStats(cards: CardStats[], now = Date.now()): DeckStats {
  let correct = 0;
  let incorrect = 0;
  let studiedCards = 0;
  for (const c of cards) {
    correct += c.correctCount ?? 0;
    incorrect += c.incorrectCount ?? 0;
    if ((c.correctCount ?? 0) + (c.incorrectCount ?? 0) > 0) studiedCards++;
  }
  return { correct, incorrect, studiedCards, missed: missedCards(cards).length, due: dueCards(cards, now).length };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Frase do baralho, ouvida sem contexto visual: "No total, 45 acertos e 12
 * erros. 3 fichas para revisar agora." null = nunca estudado.
 */
export function deckStatsText(stats: DeckStats): string | null {
  if (stats.correct + stats.incorrect === 0) return null;
  const total = `No total, ${plural(stats.correct, "acerto", "acertos")} e ${plural(stats.incorrect, "erro", "erros")}.`;
  return `${total} ${dueText(stats.due)}`;
}

/** "Nenhuma ficha para revisar agora." / "1 ficha para revisar agora." / "3 fichas..." */
export function dueText(due: number): string {
  if (due === 0) return "Nenhuma ficha para revisar agora.";
  return `${plural(due, "ficha", "fichas")} para revisar agora.`;
}

/** Campos para a API, só os que existem (ficha nunca estudada não manda nada). */
export function statsPayload(card: CardStats): CardStats {
  const correctCount = card.correctCount ?? 0;
  const incorrectCount = card.incorrectCount ?? 0;
  if (correctCount + incorrectCount === 0) return {};
  return {
    correctCount,
    incorrectCount,
    ...(card.lastAnsweredAt && typeof card.lastWasCorrect === "boolean"
      ? {
          lastAnsweredAt: card.lastAnsweredAt,
          lastWasCorrect: card.lastWasCorrect,
          reviewLevel: reviewState(card).level,
          nextReviewAt: reviewState(card).nextReviewAt,
        }
      : {}),
  };
}
