/**
 * Exportar baralhos em arquivo JSON, no mesmo formato que a importação lê:
 * um baralho é { "titulo", "fichas": [{ "pergunta", "resposta" }] } e "todos os
 * baralhos" é uma lista desses objetos. Funciona sem login. Fichas já estudadas
 * levam acertos, erros e a revisão, para importar de volta sem perder o histórico.
 */
import { reviewState, type CardStats } from "@/lib/studyStats";

/** Histórico de uma ficha no arquivo (só em fichas já estudadas) */
export interface ExportedStats {
  acertos?: number;
  erros?: number;
  /** Data da resposta mais recente (ISO) e se ela foi "Acertei" */
  ultimaResposta?: string;
  acertouUltima?: boolean;
  /** Revisão espaçada: nível (0 a 6) e data da próxima revisão (ISO) */
  nivelRevisao?: number;
  proximaRevisao?: string;
}

export interface ExportedDeck {
  titulo: string;
  /** Idioma das perguntas e das respostas (ex.: "en"); ausente = português */
  idiomaPerguntas?: string;
  idiomaRespostas?: string;
  fichas: ({ pergunta: string; resposta: string } & ExportedStats)[];
}

function exportedStats(card: CardStats): ExportedStats {
  const correct = card.correctCount ?? 0;
  const incorrect = card.incorrectCount ?? 0;
  if (correct + incorrect === 0) return {};
  const review = reviewState(card);
  return {
    acertos: correct,
    erros: incorrect,
    ...(card.lastAnsweredAt && typeof card.lastWasCorrect === "boolean"
      ? { ultimaResposta: card.lastAnsweredAt, acertouUltima: card.lastWasCorrect }
      : {}),
    ...(review.nextReviewAt ? { nivelRevisao: review.level, proximaRevisao: review.nextReviewAt } : {}),
  };
}

export function toExported(deck: {
  title: string;
  cards: ({ question: string; answer: string } & CardStats)[];
  questionLang?: string | null;
  answerLang?: string | null;
}): ExportedDeck {
  return {
    titulo: deck.title,
    ...(deck.questionLang && { idiomaPerguntas: deck.questionLang }),
    ...(deck.answerLang && { idiomaRespostas: deck.answerLang }),
    fichas: deck.cards.map((c) => ({ pergunta: c.question, resposta: c.answer, ...exportedStats(c) })),
  };
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Nome do arquivo: um baralho pelo título; todos pela data (null). */
export function exportFileName(title: string | null, today: Date): string {
  if (title !== null) return `cardvoz-${slugify(title) || "baralho"}.json`;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `cardvoz-baralhos-${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}.json`;
}

/** Baixa o arquivo (no celular, vai para a pasta Downloads). */
export function downloadJson(fileName: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Dá tempo ao navegador de começar o download antes de liberar o arquivo
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
