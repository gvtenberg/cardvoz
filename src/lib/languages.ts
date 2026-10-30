/**
 * Idiomas que a pessoa pode escolher para as perguntas e as respostas de um
 * baralho. O código vai no atributo lang, e o leitor de tela troca a voz
 * (pronuncia "irregular verbs" em inglês, não com fonética portuguesa).
 */
export const LANGUAGES = [
  { value: "pt-BR", label: "Português" },
  { value: "en", label: "Inglês" },
  { value: "es", label: "Espanhol" },
  { value: "fr", label: "Francês" },
  { value: "it", label: "Italiano" },
  { value: "de", label: "Alemão" },
];

/** null = português, o idioma da página */
export function languageName(code: string | null | undefined): string {
  return LANGUAGES.find((l) => l.value === (code ?? "pt-BR"))?.label ?? code ?? "Português";
}

/** Atributo lang só quando o idioma é diferente do da página */
export function langAttr(code: string | null | undefined): string | undefined {
  return code && code !== "pt-BR" ? code : undefined;
}
