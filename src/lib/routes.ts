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
  /** Pedir o link de nova senha por e-mail. Pública */
  forgotPassword: "/esqueci-senha/",
  /** Criar a nova senha com o código do link (#codigo=...). Pública */
  resetPassword: "/redefinir-senha/",
  /** Confirmar o e-mail com o código do link (#codigo=...). Pública */
  confirmEmail: "/confirmar-email/",
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
  /** Revisar agora: as fichas erradas e as que chegaram na data de revisão */
  review: (idOrSlug: string) => `/estudar/?deck=${idParam(idOrSlug)}&so=revisar`,
};

/**
 * Páginas que abrem sem login. As demais mandam para /entrar/. Baralhos e
 * estudo funcionam sem conta, com tudo guardado no aparelho.
 */
export const PUBLIC_PATHS = [
  routes.home,
  routes.login,
  routes.register,
  routes.forgotPassword,
  routes.resetPassword,
  routes.confirmEmail,
  routes.privacy,
  routes.decks,
  routes.newDeck,
  "/baralho/",
  "/baralho/adicionar/",
  "/estudar/",
];

/** Compara caminhos ignorando a barra final ("/entrar" e "/entrar/"). */
export function samePath(a: string, b: string): boolean {
  const normalize = (p: string) => p.replace(/\/+$/, "") || "/";
  return normalize(a) === normalize(b);
}

/**
 * Só aceita caminhos internos do site; qualquer outra coisa vai para a lista de
 * baralhos. Sem isso, um link como /entrar/?voltar=https://site-falso.com
 * levaria a pessoa, logo depois de entrar, para uma página falsa.
 *
 * A conferência resolve o endereço como o navegador faz, em vez de olhar só os
 * primeiros caracteres: o navegador apaga tab e quebra de linha antes de ler a
 * URL, então "/\t/site.com" viraria "//site.com" (outro site) e passaria numa
 * regex simples.
 */
const SAFE_ORIGIN = "https://cardvoz.invalid";

export function safeRedirect(voltar: string | null): string {
  if (!voltar || !voltar.startsWith("/")) return routes.decks;
  // Espaço ou caractere de controle não aparece em caminho do site
  if (/[\u0000- \u007F]/.test(voltar)) return routes.decks;
  try {
    const url = new URL(voltar, SAFE_ORIGIN);
    if (url.origin !== SAFE_ORIGIN) return routes.decks;
    return url.pathname + url.search + url.hash;
  } catch {
    return routes.decks;
  }
}
