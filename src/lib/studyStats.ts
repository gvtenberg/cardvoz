/**
 * Acertos e erros de cada ficha e do baralho.
 *
 * Cada ficha guarda quantas vezes foi respondida com "Acertei" e com "Errei" e
 * qual foi a resposta mais recente. A mais recente decide se a ficha entra em
 * "Estudar só as que errei": acertou depois, sai da lista.
 */

export interface CardStats {
  correctCount?: number;
  incorrectCount?: number;
  /** Quando a ficha foi respondida pela última vez (ISO); ausente = nunca */
  lastAnsweredAt?: string | null;
  lastWasCorrect?: boolean | null;
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
    // Resposta antiga (de outro aparelho, por ex.) não troca a mais recente
    const isNewer = !card.lastAnsweredAt || last.answeredAt >= card.lastAnsweredAt;
    return {
      ...card,
      correctCount: (card.correctCount ?? 0) + correct,
      incorrectCount: (card.incorrectCount ?? 0) + mine.length - correct,
      lastAnsweredAt: isNewer ? last.answeredAt : card.lastAnsweredAt,
      lastWasCorrect: isNewer ? last.wasCorrect : card.lastWasCorrect,
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
}

export function deckStats(cards: CardStats[]): DeckStats {
  let correct = 0;
  let incorrect = 0;
  let studiedCards = 0;
  for (const c of cards) {
    correct += c.correctCount ?? 0;
    incorrect += c.incorrectCount ?? 0;
    if ((c.correctCount ?? 0) + (c.incorrectCount ?? 0) > 0) studiedCards++;
  }
  return { correct, incorrect, studiedCards, missed: missedCards(cards).length };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Frase do baralho, ouvida sem contexto visual: "No total, 45 acertos e 12
 * erros. 3 fichas para revisar: você errou na última vez." null = nunca estudado.
 */
export function deckStatsText(stats: DeckStats): string | null {
  if (stats.correct + stats.incorrect === 0) return null;
  const total = `No total, ${plural(stats.correct, "acerto", "acertos")} e ${plural(stats.incorrect, "erro", "erros")}.`;
  if (stats.missed === 0) return `${total} Nenhuma ficha para revisar.`;
  const missed = stats.missed === 1
    ? "1 ficha para revisar: você errou na última vez."
    : `${stats.missed} fichas para revisar: você errou na última vez.`;
  return `${total} ${missed}`;
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
      ? { lastAnsweredAt: card.lastAnsweredAt, lastWasCorrect: card.lastWasCorrect }
      : {}),
  };
}
