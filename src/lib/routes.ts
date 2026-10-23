/**
 * Endereços internos do CardVoz.
 *
 * O site é exportado como estático (`output: "export"` + `trailingSlash`), então
 * cada página vira `pasta/index.html` e os dados variáveis (qual baralho) vão na
 * query string, que qualquer hospedagem estática serve sem configuração extra.
 */
function idParam(idOrSlug: string): string {
  return encodeURIComponent(idOrSlug);
}

export const routes = {
  /** Página de apresentação (landing page), pública */
  home: "/",
  /** Entrar com e-mail e senha ou com Google; também recebe a volta do Google. Pública */
  login: "/entrar/",
  /** Entrar e depois voltar para `voltar` (caminho interno) */
  loginThenReturn: (voltar: string) => `/entrar/?voltar=${encodeURIComponent(voltar)}`,
  /** Criar conta com nome, e-mail e senha. Pública */
  register: "/cadastro/",
  /** Criar conta e depois voltar para `voltar` (caminho interno) */
  registerThenReturn: (voltar: string) => `/cadastro/?voltar=${encodeURIComponent(voltar)}`,
  /** Política de privacidade, pública */
  privacy: "/privacidade/",
  profile: "/perfil/",
  /** Lista de baralhos de quem usa o app */
  decks: "/baralhos/",
  newDeck: "/baralhos/novo/",
  importDeck: "/baralhos/novo/#importar",
  deck: (idOrSlug: string) => `/baralho/?id=${idParam(idOrSlug)}`,
  addCards: (idOrSlug: string) => `/baralho/adicionar/?id=${idParam(idOrSlug)}`,
  study: (idOrSlug: string) => `/estudar/?deck=${idParam(idOrSlug)}`,
};

/** Páginas que abrem sem login. As demais mandam para /entrar/. */
export const PUBLIC_PATHS = [routes.home, routes.login, routes.register, routes.privacy];

/** Compara caminhos ignorando a barra final ("/entrar" e "/entrar/"). */
export function samePath(a: string, b: string): boolean {
  const normalize = (p: string) => p.replace(/\/+$/, "") || "/";
  return normalize(a) === normalize(b);
}

/**
 * Só aceita caminhos internos do site; qualquer outra coisa vai para a lista de
 * baralhos. Sem isso, um link como /entrar/?voltar=https://site-falso.com
 * levaria a pessoa, logo depois de entrar, para uma página falsa. Recusa também
 * //site.com e /\site.com, que o navegador trataria como outro site.
 */
export function safeRedirect(voltar: string | null): string {
  return voltar && /^\/(?![\\/])/.test(voltar) ? voltar : routes.decks;
}
