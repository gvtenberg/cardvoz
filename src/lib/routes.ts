/**
 * Endereços internos do CardVoz.
 *
 * O site é exportado como estático (`output: "export"` + `trailingSlash`), então
 * cada página vira `pasta/index.html` e os dados variáveis (qual baralho) vão na
 * query string, que qualquer hospedagem estática serve sem configuração extra.
 */
function idParam(idOrSlug: string | number): string {
  return encodeURIComponent(String(idOrSlug));
}

export const routes = {
  /** Página de apresentação (landing page), pública */
  home: "/",
  /** Lista de baralhos de quem usa o app */
  decks: "/baralhos/",
  newDeck: "/baralhos/novo/",
  importDeck: "/baralhos/novo/#importar",
  deck: (idOrSlug: string | number) => `/baralho/?id=${idParam(idOrSlug)}`,
  addCards: (idOrSlug: string | number) => `/baralho/adicionar/?id=${idParam(idOrSlug)}`,
  study: (idOrSlug: string | number) => `/estudar/?deck=${idParam(idOrSlug)}`,
};
