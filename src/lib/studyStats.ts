/**
 * Acertos, erros e revisão espaçada de cada ficha e do baralho.
 *
 * Cada ficha guarda quantas vezes foi respondida com "Acertei" e com "Errei",
 * a resposta mais recente e a revisão espaçada, no estilo do Anki (algoritmo
 * SM-2 com duas respostas: "Acertei" vale como "Bom" e "Errei" como "De novo"):
 * - "Acertei" numa ficha nova ou errada marca a revisão para daqui a 1 dia;
 * - "Acertei" numa ficha em revisão multiplica o intervalo pela facilidade da
 *   ficha (começa em 2,5: 1 dia, 3, 8, 20, 50, 125... até 1 ano);
 * - "Errei" volta a ficha para revisar na hora e, se ela estava em revisão,
 *   baixa a facilidade em 0,2 (mínimo 1,3).
 * A API faz a mesma conta (Card.RecordAnswer), com os mesmos casos de teste:
 * mude as duas juntas. Só inteiros (milissegundos e milésimos), para o
 * resultado ser igual em JavaScript e em C#.
 */

export interface CardStats {
  correctCount?: number;
  incorrectCount?: number;
  /** Quando a ficha foi respondida pela última vez (ISO); ausente = nunca */
  lastAnsweredAt?: string | null;
  lastWasCorrect?: boolean | null;
  /** Quando a ficha volta para "Revisar agora" (ISO); ausente = nunca estudada */
  nextReviewAt?: string | null;
  /** Revisão espaçada: facilidade em milésimos (2500 = 2,5); ausente = 2500 */
  reviewEase?: number;
}

export const DEFAULT_REVIEW_EASE = 2500;
export const MIN_REVIEW_EASE = 1300;
/** Quanto a facilidade cai quando a pessoa erra uma ficha que estava em revisão */
const LAPSE_EASE_PENALTY = 200;
/** Nenhuma ficha fica mais de 1 ano sem voltar */
const MAX_REVIEW_INTERVAL_DAYS = 365;
const DAY = 24 * 60 * 60 * 1000;

/** Data + espera. Data inválida (dado estragado no aparelho) fica como está, sem quebrar a tela. */
function addMs(iso: string, ms: number): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? iso : new Date(time + ms).toISOString();
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Divisão de inteiros positivos arredondada para o mais próximo (meio para cima), sem erro de ponto flutuante. */
function roundDiv(a: number, b: number): number {
  const n = a + b / 2;
  return (n - (n % b)) / b;
}

export interface ReviewState {
  /** Intervalo em vigor, em dias (0 = nova, ou errada da última vez) */
  intervalDays: number;
  ease: number;
  nextReviewAt: string | null;
}

/**
 * Intervalo, facilidade e próxima revisão da ficha. O intervalo não é guardado:
 * são os dias entre a última resposta e a próxima revisão. Assim as fichas das
 * versões anteriores (caixa de Leitner) continuam de onde estavam, e as que só
 * têm a última resposta ganham o que dá para deduzir: errou = revisar na hora;
 * acertou = 1 dia.
 */
export function reviewState(card: CardStats): ReviewState {
  const rawEase = Number.isFinite(card.reviewEase) ? Math.round(card.reviewEase!) : DEFAULT_REVIEW_EASE;
  const ease = clamp(rawEase, MIN_REVIEW_EASE, DEFAULT_REVIEW_EASE);
  if (!card.lastAnsweredAt || typeof card.lastWasCorrect !== "boolean") {
    return { intervalDays: 0, ease, nextReviewAt: card.nextReviewAt ?? null };
  }
  if (!card.lastWasCorrect) return { intervalDays: 0, ease, nextReviewAt: card.nextReviewAt ?? card.lastAnsweredAt };

  const span = card.nextReviewAt ? Date.parse(card.nextReviewAt) - Date.parse(card.lastAnsweredAt) : NaN;
  // Quem acertou por último tem pelo menos 1 dia de intervalo
  const intervalDays = span > 0 ? clamp(roundDiv(span, DAY), 1, MAX_REVIEW_INTERVAL_DAYS) : 1;
  return { intervalDays, ease, nextReviewAt: card.nextReviewAt ?? addMs(card.lastAnsweredAt, intervalDays * DAY) };
}

/** Intervalo depois de um "Acertei" dado em `answeredAt`. */
function nextIntervalDays(state: ReviewState, lastAnsweredAt: string | null | undefined, answeredAt: string): number {
  // Ficha nova, ou errada da última vez: volta amanhã
  if (state.intervalDays <= 0) return 1;

  const at = Date.parse(answeredAt);
  const due = state.nextReviewAt ? Date.parse(state.nextReviewAt) : NaN;
  let next: number;
  if (at >= due) {
    // Na data ou atrasada: metade do atraso conta como intervalo cumprido,
    // e o intervalo sempre cresce pelo menos 1 dia
    next = Math.max(state.intervalDays + 1, roundDiv((2 * state.intervalDays * DAY + (at - due)) * state.ease, 2000 * DAY));
  } else {
    // Antes da data (ex.: "Estudar" com todas as fichas): conta só o tempo que
    // passou desde a última resposta, e o intervalo não encolhe. Estudar a
    // mesma ficha todo dia não a empurra para daqui a meses
    const elapsed = lastAnsweredAt ? at - Date.parse(lastAnsweredAt) : NaN;
    next = Math.max(state.intervalDays, elapsed > 0 ? roundDiv(elapsed * state.ease, 1000 * DAY) : 0);
  }
  return Math.min(next, MAX_REVIEW_INTERVAL_DAYS);
}

/** Soma uma resposta na ficha e recalcula a revisão. */
function answerCard<T extends CardStats>(card: T, wasCorrect: boolean, answeredAt: string): T {
  const counted = {
    ...card,
    correctCount: (card.correctCount ?? 0) + (wasCorrect ? 1 : 0),
    incorrectCount: (card.incorrectCount ?? 0) + (wasCorrect ? 0 : 1),
  };
  // Resposta antiga (de outro aparelho, por ex.) não troca a mais recente nem a revisão
  if (card.lastAnsweredAt && Date.parse(answeredAt) < Date.parse(card.lastAnsweredAt)) return counted;

  const state = reviewState(card);
  let intervalDays = 0;
  let ease = state.ease;
  if (wasCorrect) {
    intervalDays = nextIntervalDays(state, card.lastAnsweredAt, answeredAt);
  } else if (state.intervalDays > 0) {
    // Só o erro de uma ficha que estava em revisão a deixa mais difícil;
    // errar de novo antes de acertar não baixa a facilidade outra vez
    ease = Math.max(MIN_REVIEW_EASE, ease - LAPSE_EASE_PENALTY);
  }
  return {
    ...counted,
    lastAnsweredAt: answeredAt,
    lastWasCorrect: wasCorrect,
    reviewEase: ease,
    // Errou: 0 dias, volta para "Revisar agora" na hora
    nextReviewAt: addMs(answeredAt, intervalDays * DAY),
  };
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

/** Soma as respostas de uma rodada nas fichas, da mais antiga para a mais nova (as não respondidas ficam iguais). */
export function applyAnswers<T extends CardStats & { id: string; aliases?: string[] }>(
  cards: T[],
  answers: StudyAnswer[]
): T[] {
  return cards.map((card) => {
    const mine = answers.filter((a) => a.cardId === card.id || card.aliases?.includes(a.cardId));
    if (mine.length === 0) return card;
    return [...mine]
      .sort((a, b) => Date.parse(a.answeredAt) - Date.parse(b.answeredAt))
      .reduce((current, a) => answerCard(current, a.wasCorrect, a.answeredAt), card);
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
          reviewEase: reviewState(card).ease,
          nextReviewAt: reviewState(card).nextReviewAt,
        }
      : {}),
  };
}
