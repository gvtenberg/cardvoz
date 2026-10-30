/**
 * CardVoz - Leitura de fichas a partir de arquivos externos (TXT, CSV e JSON)
 *
 * Formatos aceitos:
 * - TXT: uma ficha por linha ("pergunta; resposta", também com TAB ou "|"),
 *        blocos separados por linha em branco (1ª linha = pergunta, resto = resposta)
 *        ou linhas prefixadas com "P:" / "R:".
 * - CSV: colunas pergunta e resposta, separadas por vírgula ou ponto e vírgula,
 *        com ou sem linha de cabeçalho.
 * - JSON: lista de fichas ou objeto { "titulo": "...", "fichas": [...] }, em que
 *        cada ficha é { "pergunta", "resposta" } (ou question/answer, frente/verso)
 *        ou um par ["pergunta", "resposta"]. Uma lista desses objetos (o arquivo
 *        de "Exportar todos") vira vários baralhos.
 */

import { isLanguageCode } from "@/lib/local/decks";

export interface ImportedCard {
  question: string;
  answer: string;
}

export interface ImportResult {
  fileName: string;
  /** Título sugerido para o baralho (do JSON ou do nome do arquivo) */
  title: string;
  cards: ImportedCard[];
  /** Linhas ou itens ignorados por não terem pergunta e resposta */
  skipped: number;
  /** Arquivo com vários baralhos: um item por baralho (cards = todas as fichas) */
  decks?: ImportedDeck[];
  /** Idioma das perguntas e das respostas (só no JSON exportado); null = português */
  questionLang: string | null;
  answerLang: string | null;
}

export interface ImportedDeck {
  title: string;
  cards: ImportedCard[];
  questionLang: string | null;
  answerLang: string | null;
}

type Parsed = {
  title?: string;
  cards: ImportedCard[];
  skipped: number;
  decks?: ImportedDeck[];
  questionLang?: string | null;
  answerLang?: string | null;
};

const QUESTION_LANG_KEYS = ["idiomaperguntas", "idioma_perguntas", "questionlang"];
const ANSWER_LANG_KEYS = ["idiomarespostas", "idioma_respostas", "answerlang"];

/** Idioma do arquivo, só se for um código válido (o valor vai para o atributo lang) */
function languageOf(obj: Record<string, unknown>, keys: string[]): string | null {
  const value = pick(obj, keys);
  return isLanguageCode(value) ? value : null;
}

export class ImportError extends Error {}

export const IMPORT_ACCEPT = ".txt,.csv,.json,text/plain,text/csv,application/json";
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_IMPORT_CARDS = 1000;

const QUESTION_KEYS = ["pergunta", "question", "frente", "front", "q", "termo", "term"];
const ANSWER_KEYS = ["resposta", "answer", "verso", "back", "a", "definicao", "definition"];
const TITLE_KEYS = ["titulo", "title", "nome", "name", "baralho", "deck"];
const LIST_KEYS = ["fichas", "cartoes", "cards", "perguntas", "itens", "items"];

function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const [rawKey, value] of Object.entries(obj)) {
    if (keys.includes(normalizeKey(rawKey))) return value;
  }
  return undefined;
}

function toText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function titleFromFileName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : "Baralho importado";
}

// --- JSON -------------------------------------------------------------------

function parseEntries(entries: unknown[]): { cards: ImportedCard[]; skipped: number } {
  const cards: ImportedCard[] = [];
  let skipped = 0;
  for (const entry of entries) {
    let question = "";
    let answer = "";
    if (Array.isArray(entry)) {
      question = toText(entry[0]);
      answer = toText(entry[1]);
    } else if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      question = toText(pick(obj, QUESTION_KEYS));
      answer = toText(pick(obj, ANSWER_KEYS));
    }
    if (question && answer) {
      cards.push({ question, answer });
    } else {
      skipped++;
    }
  }
  return { cards, skipped };
}

/** Lista em que todo item é um baralho ({ titulo, fichas }) */
function isDeckList(data: unknown[]): data is Record<string, unknown>[] {
  return (
    data.length > 0 &&
    data.every(
      (item) =>
        item !== null && typeof item === "object" && !Array.isArray(item) &&
        Array.isArray(pick(item as Record<string, unknown>, LIST_KEYS))
    )
  );
}

function parseJson(text: string): Parsed {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("O arquivo JSON tem um erro de formatação e não pôde ser lido.");
  }

  let title: string | undefined;
  let entries: unknown;
  let questionLang: string | null = null;
  let answerLang: string | null = null;

  if (Array.isArray(data) && isDeckList(data)) {
    let skipped = 0;
    const decks = data.map((item, i) => {
      const parsed = parseEntries(pick(item, LIST_KEYS) as unknown[]);
      skipped += parsed.skipped;
      return {
        title: toText(pick(item, TITLE_KEYS)) || `Baralho ${i + 1}`,
        cards: parsed.cards,
        questionLang: languageOf(item, QUESTION_LANG_KEYS),
        answerLang: languageOf(item, ANSWER_LANG_KEYS),
      };
    });
    return {
      title: decks[0].title,
      cards: decks.flatMap((d) => d.cards),
      skipped,
      decks,
      questionLang: decks[0].questionLang,
      answerLang: decks[0].answerLang,
    };
  }

  if (Array.isArray(data)) {
    entries = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    title = toText(pick(obj, TITLE_KEYS)) || undefined;
    entries = pick(obj, LIST_KEYS);
    questionLang = languageOf(obj, QUESTION_LANG_KEYS);
    answerLang = languageOf(obj, ANSWER_LANG_KEYS);
  }

  if (!Array.isArray(entries)) {
    throw new ImportError(
      'Não encontramos a lista de fichas no JSON. Use uma lista ou a chave "fichas".'
    );
  }

  const { cards, skipped } = parseEntries(entries);
  return { title, cards, skipped, questionLang, answerLang };
}

// --- CSV --------------------------------------------------------------------

function detectCsvDelimiter(text: string): string {
  const firstLine = text.split("\n", 1)[0];
  const candidates = [";", ",", "\t"];
  let best = ",";
  let bestCount = 0;
  for (const delimiter of candidates) {
    // Conta apenas fora de aspas
    let count = 0;
    let inQuotes = false;
    for (const char of firstLine) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === delimiter && !inQuotes) count++;
    }
    if (count > bestCount) {
      best = delimiter;
      bestCount = count;
    }
  }
  return best;
}

function parseCsvRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  rows.push(row);

  return rows
    .map((r) => r.map((cell) => cell.trim()))
    .filter((r) => r.some((cell) => cell !== ""));
}

function parseCsv(text: string): { cards: ImportedCard[]; skipped: number } {
  const rows = parseCsvRows(text, detectCsvDelimiter(text));
  if (rows.length === 0) return { cards: [], skipped: 0 };

  let questionCol = 0;
  let answerCol = 1;
  // Chaves de uma letra ("q", "a") são ambíguas demais para identificar cabeçalho
  const header = rows[0].map(normalizeKey);
  const isHeaderOf = (keys: string[]) => (cell: string) => cell.length > 1 && keys.includes(cell);
  const headerQuestion = header.findIndex(isHeaderOf(QUESTION_KEYS));
  const headerAnswer = header.findIndex(isHeaderOf(ANSWER_KEYS));
  const hasHeader = headerQuestion !== -1 || headerAnswer !== -1;
  if (hasHeader) {
    questionCol = headerQuestion !== -1 ? headerQuestion : headerAnswer === 0 ? 1 : 0;
    answerCol = headerAnswer !== -1 ? headerAnswer : questionCol === 0 ? 1 : 0;
  }

  const cards: ImportedCard[] = [];
  let skipped = 0;
  for (const row of hasHeader ? rows.slice(1) : rows) {
    const question = row[questionCol] ?? "";
    const answer = row[answerCol] ?? "";
    if (question && answer) {
      cards.push({ question, answer });
    } else {
      skipped++;
    }
  }
  return { cards, skipped };
}

// --- TXT --------------------------------------------------------------------

const QUESTION_PREFIX = /^(p|pergunta|q|question|frente)\s*[:)\-–]\s*/i;
const ANSWER_PREFIX = /^(r|resposta|a|answer|verso)\s*[:)\-–]\s*/i;

function parsePrefixed(lines: string[]): { cards: ImportedCard[]; skipped: number } {
  const cards: ImportedCard[] = [];
  let skipped = 0;
  let question = "";
  let answer = "";
  let target: "question" | "answer" | null = null;

  const flush = () => {
    if (question || answer) {
      if (question && answer) cards.push({ question, answer });
      else skipped++;
    }
    question = "";
    answer = "";
    target = null;
  };

  for (const line of lines) {
    if (QUESTION_PREFIX.test(line)) {
      flush();
      question = line.replace(QUESTION_PREFIX, "").trim();
      target = "question";
    } else if (ANSWER_PREFIX.test(line) && target === "question") {
      answer = line.replace(ANSWER_PREFIX, "").trim();
      target = "answer";
    } else if (line && target === "question") {
      question = `${question} ${line}`.trim();
    } else if (line && target === "answer") {
      answer = `${answer} ${line}`.trim();
    }
  }
  flush();
  return { cards, skipped };
}

function parseTxt(text: string): { cards: ImportedCard[]; skipped: number } {
  const lines = text.split("\n").map((line) => line.trim());
  const filled = lines.filter(Boolean);
  if (filled.length === 0) return { cards: [], skipped: 0 };

  // 1) Linhas com "P:" e "R:"
  if (filled.some((line) => QUESTION_PREFIX.test(line)) && filled.some((line) => ANSWER_PREFIX.test(line))) {
    return parsePrefixed(lines);
  }

  // 2) Uma ficha por linha com separador (o mais frequente entre TAB, ";" e "|")
  const separators = ["\t", ";", "|"];
  const [separator, hits] = separators
    .map((sep) => [sep, filled.filter((line) => line.includes(sep)).length] as const)
    .sort((a, b) => b[1] - a[1])[0];
  if (hits > 0 && hits >= filled.length / 2) {
    const cards: ImportedCard[] = [];
    let skipped = 0;
    for (const line of filled) {
      const index = line.indexOf(separator);
      const question = index === -1 ? "" : line.slice(0, index).trim();
      const answer = index === -1 ? "" : line.slice(index + separator.length).trim();
      if (question && answer) cards.push({ question, answer });
      else skipped++;
    }
    return { cards, skipped };
  }

  // 3) Blocos separados por linha em branco: 1ª linha = pergunta, demais = resposta
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((block) => block.length > 0);
  const cards: ImportedCard[] = [];
  let skipped = 0;
  for (const block of blocks) {
    if (block.length >= 2) {
      cards.push({ question: block[0], answer: block.slice(1).join(" ") });
    } else {
      skipped++;
    }
  }
  return { cards, skipped };
}

// --- Entrada pública --------------------------------------------------------

export function parseImportText(text: string, fileName: string): ImportResult {
  const clean = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const extension = fileName.toLowerCase().split(".").pop() || "";
  const looksLikeJson = /^\s*[[{]/.test(clean);

  let parsed: Parsed;
  if (extension === "json" || looksLikeJson) {
    parsed = parseJson(clean);
  } else if (extension === "csv") {
    parsed = parseCsv(clean);
  } else {
    parsed = parseTxt(clean);
  }

  if (parsed.cards.length === 0) {
    throw new ImportError(
      "Não encontramos fichas neste arquivo. Confira se cada ficha tem pergunta e resposta."
    );
  }
  if (parsed.cards.length > MAX_IMPORT_CARDS) {
    throw new ImportError(
      `O arquivo tem ${parsed.cards.length} fichas. O limite é ${MAX_IMPORT_CARDS} por vez; divida em arquivos menores.`
    );
  }

  return {
    fileName,
    title: parsed.title || titleFromFileName(fileName),
    cards: parsed.cards,
    skipped: parsed.skipped,
    ...(parsed.decks && { decks: parsed.decks }),
    questionLang: parsed.questionLang ?? null,
    answerLang: parsed.answerLang ?? null,
  };
}

export async function readImportFile(file: File): Promise<ImportResult> {
  const extension = file.name.toLowerCase().split(".").pop() || "";
  if (!["txt", "csv", "json"].includes(extension)) {
    throw new ImportError("Formato não aceito. Escolha um arquivo TXT, CSV ou JSON.");
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new ImportError("O arquivo é muito grande. O limite é 2 MB.");
  }
  const text = await file.text();
  return parseImportText(text, file.name);
}
