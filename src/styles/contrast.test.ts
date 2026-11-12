/**
 * Contraste das cores do tema (regra 4 do AGENTS.md), conferido a cada `npm test`:
 * texto ≥ 7:1 (WCAG AAA) e contorno de controles e anel de foco ≥ 3:1 (WCAG
 * 1.4.11), nos dois temas. Os pares são os que aparecem juntos na interface;
 * quem criar um par novo de cores acrescenta aqui.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const scss = readFileSync(path.join(__dirname, "_variables.scss"), "utf8");

function color(theme: "light" | "dark", name: string): string {
  // primary-fg e success-fg do tema claro são branco (definidos em globals.scss)
  if (theme === "light" && (name === "primary-fg" || name === "success-fg")) return "#FFFFFF";
  const match = scss.match(new RegExp(`\\$color-${theme}-${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match) throw new Error(`Cor $color-${theme}-${name} não encontrada`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SURFACES = ["bg", "surface", "surface-soft"];

// [texto, fundos onde ele aparece]
const TEXT: [string, string[]][] = [
  ["ink", [...SURFACES, "primary-soft", "answer-bg"]],
  ["text", [...SURFACES, "primary-soft", "success-soft", "danger-soft", "answer-bg"]],
  ["text-muted", [...SURFACES, "primary-soft", "success-soft", "danger-soft"]],
  ["primary", SURFACES],
  ["primary-soft-text", [...SURFACES, "primary-soft", "answer-bg"]],
  ["success-soft-text", [...SURFACES, "success-soft"]],
  ["danger-text", [...SURFACES, "danger-soft", "danger-soft-hover"]],
  ["primary-fg", ["primary", "primary-hover"]],
  ["success-fg", ["success", "success-hover"]],
];

// [contorno, fundos] — contornos de botões e campos sobre a página e os painéis
const BORDERS: [string, string[]][] = [
  ["border-strong", SURFACES],
  ["primary-soft-text", SURFACES],
  ["danger-text", SURFACES],
  ["focus-ring", SURFACES],
];

describe.each(["light", "dark"] as const)("contraste no tema %s", (theme) => {
  for (const [fg, backgrounds] of TEXT) {
    for (const bg of backgrounds) {
      it(`texto ${fg} sobre ${bg} ≥ 7:1`, () => {
        expect(ratio(color(theme, fg), color(theme, bg))).toBeGreaterThanOrEqual(7);
      });
    }
  }
  for (const [line, backgrounds] of BORDERS) {
    for (const bg of backgrounds) {
      it(`contorno ${line} sobre ${bg} ≥ 3:1`, () => {
        expect(ratio(color(theme, line), color(theme, bg))).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
