/**
 * Busca de fichas dentro do baralho (RF09): procura na pergunta e na resposta,
 * sem diferenciar maiúsculas nem acentos ("mitocondria" acha "mitocôndria").
 */

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("pt-BR");
}

export function filterCards<T extends { question: string; answer: string }>(cards: T[], query: string): T[] {
  const term = normalize(query.trim());
  if (!term) return cards;
  return cards.filter((c) => normalize(c.question).includes(term) || normalize(c.answer).includes(term));
}

/** Texto do anúncio (role="status"): muda a cada busca, então o leitor de tela lê de novo. */
export function resultsText(count: number, query: string): string {
  if (count === 0) return `Nenhuma ficha encontrada para “${query.trim()}”.`;
  return count === 1 ? "1 ficha encontrada." : `${count} fichas encontradas.`;
}
