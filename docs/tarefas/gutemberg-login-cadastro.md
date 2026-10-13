# Tarefa: login, cadastro, sessão, perfil e menu

**Responsável:** Gutemberg
**Repositório:** CardVoz (frontend)
**Depende de:** API com autenticação no ar (`cardvoz-api`) e migration `20261013000000_usuarios_e_ids_aleatorios.sql` aplicada no Supabase (`cardvoz-db`).
**Quem depende desta tarefa:** Élida (edição e exclusão de baralhos e fichas) precisa dos **Passos 1 a 3** prontos.

Antes de começar, leia o [`AGENTS.md`](../../AGENTS.md) da raiz (regras de acessibilidade, estilo e arquitetura) e a seção **"🔐 Autenticação"** do README da `cardvoz-api`.

---

## 1. Contexto: por que esta tarefa existe

A API passou a ter **contas de usuário** e os baralhos ficaram **privados**: cada pessoa só vê e altera os próprios. Toda rota (exceto as de `/api/auth`) agora exige um token de login.

O frontend ainda não sabe fazer login. Por isso, hoje **toda chamada recebe 401** e o `api.ts` cai silenciosamente nos baralhos de exemplo guardados no próprio site. A tela parece funcionar, mas nada é salvo de verdade. Esta tarefa resolve isso.

## 2. Escopo

**Entra:**
- Páginas de **cadastro** (`/cadastro/`), **login** (`/entrar/`) e **perfil** (`/perfil/`).
- Guardar e enviar os tokens, renovar a sessão sozinho e fazer **logout**.
- Proteger as páginas: quem não está logado vai para o login e volta para onde estava.
- Trocar os tipos de ID de `number` para `string` (a API agora usa UUID).
- Remover o fallback de dados de exemplo do `api.ts`.
- **Menu "burger"** no cabeçalho, porque os novos itens (Perfil, Sair) não cabem na largura do celular.

**Não entra** (a API ainda não tem as rotas; viram tarefas futuras):
- Editar nome/e-mail, trocar senha, recuperar senha esquecida, excluir a conta.
- Edição e exclusão de baralhos e fichas (tarefa da Élida).

---

## 3. Contrato da API

Respostas reais da API, conferidas em teste.

| Rota | Corpo enviado | Sucesso | Precisa de token? |
|---|---|---|---|
| `POST /api/auth/register` | `{ name, email, password }` | `201` + tokens | Não |
| `POST /api/auth/login` | `{ email, password }` | `200` + tokens | Não |
| `POST /api/auth/refresh` | `{ refreshToken }` | `200` + **novos** tokens | Não |
| `POST /api/auth/logout` | `{ refreshToken }` | `204` (sempre) | Não |
| `GET /api/auth/me` | — | `200` + usuário | Sim |

Cadastro, login e renovação devolvem:

```json
{
  "accessToken": "eyJhbGciOiJI…",
  "accessTokenExpiresAt": "2026-10-13T01:45:51.82Z",
  "refreshToken": "wjSTpW2n…",
  "refreshTokenExpiresAt": "2026-11-12T01:30:51.70Z",
  "user": { "id": "0f74559d-313e-47e1-b29d-24db561e6570", "name": "Teste", "email": "t@exemplo.com", "createdAt": "2026-10-13T01:30:51.57Z" }
}
```

- **accessToken**: vale **15 minutos**. Vai no cabeçalho `Authorization: Bearer <accessToken>` de toda chamada.
- **refreshToken**: vale **30 dias**. Só serve para `/refresh` e `/logout`. **Cada uso gera um novo e o anterior deixa de valer** (rotação).

### Erros que você precisa tratar

| Situação | Status | Corpo |
|---|---|---|
| Campo inválido | `400` | `{ "errors": { "Name": ["O nome é obrigatório."], "Email": ["Informe um e-mail válido."], "Password": ["A senha precisa ter pelo menos 8 caracteres."] } }` (chaves com inicial maiúscula) |
| E-mail já cadastrado | `409` | `{ "message": "Já existe uma conta com este e-mail." }` |
| E-mail ou senha errados | `401` | `{ "message": "E-mail ou senha incorretos." }` (igual para e-mail inexistente) |
| 5 senhas erradas seguidas | `429` + cabeçalho `Retry-After: 900` (segundos) | `{ "message": "Muitas tentativas de login. Tente de novo em 15 minuto(s)." }` |
| Mais de 10 chamadas/minuto do mesmo IP | `429` | `{ "message": "Muitas tentativas. Aguarde um minuto e tente de novo." }` |
| Refresh inválido, vencido ou já usado | `401` | `{ "message": "Sessão expirada. Entre novamente." }` |
| Rota protegida sem token ou com token vencido | `401` | **sem corpo** (só o cabeçalho `WWW-Authenticate: Bearer`) |

Regras de validação: nome até 100 caracteres; e-mail até 254; senha de **8 a 128** caracteres.

> ⚠️ **Detecção de roubo:** se um refreshToken que **já foi trocado** for usado de novo depois de 30 segundos, a API entende que ele foi copiado e **encerra todas as sessões da pessoa**. Isso torna obrigatório o cuidado do Passo 3 (nunca renovar duas vezes com o mesmo token).

---

## 4. Arquitetura proposta

```
src/lib/auth/session.ts        # Guarda os tokens (memória + localStorage) e renova a sessão
src/lib/api.ts                 # fetchApi envia o token, renova no 401 e lança ApiError
src/components/AuthProvider/   # Contexto React: usuário, status, login(), register(), logout()
src/components/AuthGate/       # Protege as páginas: carregando → skeleton; deslogado → /entrar/
src/components/Header/         # Cabeçalho com menu burger
src/app/entrar/                # Login
src/app/cadastro/              # Cadastro
src/app/perfil/                # Perfil
src/lib/routes.ts              # + routes.login, routes.register, routes.profile
```

**Por que um `AuthGate` único no layout, e não uma checagem em cada página?** Uma regra num lugar só não esquece nenhuma página nova. Além disso, você não precisa mexer nos arquivos das páginas, que a Élida vai editar ao mesmo tempo (menos conflito de merge).

---

## 5. Passo a passo

Faça um **PR por passo** (ou por grupo de passos), na ordem. PRs pequenos são mais fáceis de revisar e destravam a Élida mais cedo.

### Passo 1 — IDs como texto e fim dos dados de exemplo  *(primeiro PR — avise a Élida quando entrar)*

1. Em `src/lib/api.ts`, troque `id`, `deckId` e `cardId` de `number` para `string` nos tipos e nos parâmetros das funções.
2. Remova o `FALLBACK_DECKS`, a `localDecksMemory`, a `localSessionsMemory` e os blocos `catch` que caem nos dados locais. As funções devem **lançar o erro** (veja o `ApiError` no Passo 3).
3. Ajuste o que quebrar no TypeScript (`npx tsc --noEmit` mostra tudo).

**Por quê:** a API devolve UUID em texto (`"0f74559d-…"`). Com o tipo errado, o TypeScript deixa passar bugs como `id + 1`. O fallback, por sua vez, **mente para a pessoa**: mostra "baralho criado" quando nada foi salvo. Agora que os dados são privados, não existe mais "baralho de exemplo" que faça sentido mostrar. O certo é mostrar o erro e um caminho para resolver.

### Passo 2 — Onde guardar os tokens (`src/lib/auth/session.ts`)

| Token | Onde guardar | Por quê |
|---|---|---|
| `accessToken` | **Só em memória** (variável do módulo) | É o que dá acesso aos dados. Fora do `localStorage`, um script malicioso tem menos chance de copiá-lo. Como dura só 15 minutos, perdê-lo ao recarregar a página não é problema: o refresh gera outro. |
| `refreshToken` | **`localStorage`** (chave `cardvoz.refreshToken`) | Precisa sobreviver ao fechar o navegador, senão a pessoa teria que digitar a senha toda vez (difícil para quem usa leitor de tela). Ele não abre os dados sozinho: só troca por um accessToken, e a rotação + detecção de roubo limitam o estrago se vazar. |

**Por que não usar cookie `httpOnly`, que seria o ideal?** O site (`cardvoz.onrender.com`) e a API (`cardvoz-api.onrender.com`) são **sites diferentes** para o navegador (`onrender.com` está na lista de sufixos públicos). Cookies entre sites diferentes são bloqueados pelo Safari e cada vez mais pelo Chrome. Se um dia site e API ficarem no mesmo domínio próprio (ex.: `app.cardvoz.com.br` e `api.cardvoz.com.br`), vale migrar para cookie.

Exemplo de referência:

```ts
// src/lib/auth/session.ts
const REFRESH_KEY = "cardvoz.refreshToken";

let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null; // modo privado ou armazenamento bloqueado
  }
}

export function saveSession(auth: AuthResponse) {
  accessToken = auth.accessToken;
  try {
    localStorage.setItem(REFRESH_KEY, auth.refreshToken);
  } catch {
    // Sem armazenamento: a sessão dura só enquanto a aba estiver aberta
  }
}

export function clearSession() {
  accessToken = null;
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {}
}
```

### Passo 3 — `fetchApi` com token e renovação automática

Regras:

1. Toda chamada envia `Authorization: Bearer <accessToken>` quando houver token.
2. Se a resposta for **401** numa rota que não é de `/api/auth`: renove **uma vez** e repita a chamada. Se a renovação falhar, limpe a sessão e mande para `/entrar/?voltar=<página atual>`.
3. **Só uma renovação por vez**, inclusive entre abas. Se três chamadas recebem 401 juntas, elas esperam a mesma renovação. Sem isso, duas renovações com o mesmo refreshToken disparam a detecção de roubo da API e derrubam a pessoa de todos os aparelhos.
4. Erros viram um `ApiError` com o status e as mensagens, para as telas decidirem o que mostrar. Élida também vai usar essa classe.

Exemplo de referência:

```ts
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string[]> = {}
  ) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

/** Renova a sessão. Chamadas simultâneas (e outras abas) esperam a mesma renovação. */
export function refreshSession(): Promise<boolean> {
  return (refreshing ??= (async () => {
    try {
      // A trava "cardvoz-refresh" vale para todas as abas do site
      return await navigator.locks.request("cardvoz-refresh", renovar);
    } finally {
      refreshing = null;
    }
  })());
}

async function renovar(): Promise<boolean> {
  // Lê o token DENTRO da trava: se outra aba renovou enquanto esperávamos,
  // usamos o token novo dela, e não o antigo (que já foi invalidado).
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    clearSession();
    return false;
  }
  saveSession(await response.json());
  return true;
}
```

`navigator.locks` (Web Locks API) funciona em todos os navegadores atuais e garante que só uma aba renova por vez.

**Por que não decodificar o JWT no frontend para saber se venceu?** Você poderia usar o `accessTokenExpiresAt` para renovar um pouco antes de vencer (é uma melhoria opcional). Mas nunca use o conteúdo do token para decidir permissões: quem decide é a API.

### Passo 4 — `AuthProvider` (contexto de sessão)

Um componente `"use client"` que envolve o app no `layout.tsx` e oferece:

- `status`: `"carregando"` | `"logado"` | `"deslogado"`
- `user`: `{ id, name, email, createdAt }` ou `null`
- `login(email, senha)`, `register(nome, email, senha)` e `logout()`

**Ao abrir o site:** se existir refreshToken no `localStorage`, chame `refreshSession()`. A resposta já traz o `user`, então não precisa chamar o `/me`. Enquanto isso, o `status` fica `"carregando"`.

**Por quê:** o accessToken fica só em memória, então some ao recarregar a página. Sem esse passo, toda recarga mandaria a pessoa para o login. E sem o estado `"carregando"`, a tela de login apareceria por meio segundo antes da sessão ser restaurada, o que confunde, principalmente com leitor de tela.

**Sincronizar abas:** escute o evento `storage` do `window`. Se a chave `cardvoz.refreshToken` for removida em outra aba (logout), limpe a sessão desta aba também e vá para o login.

### Passo 5 — Páginas de cadastro e login

Siga a composição de página do `AGENTS.md` (seção 8): `main` de `40rem`, `h1`, painel `surface`, botão principal grande e largo. Use os componentes `Input` e `Button`.

**Campos (atributos importam):**

| Campo | Atributos | Por quê |
|---|---|---|
| Nome (só cadastro) | `autoComplete="name"` | O navegador e o leitor de tela sugerem o nome |
| E-mail | `type="email"`, `autoComplete="email"`, `inputMode="email"`, `autoCapitalize="none"`, `spellCheck={false}` | Teclado certo no celular, sem maiúscula automática nem corretor estragando o e-mail |
| Senha | `type="password"`, `autoComplete="current-password"` (login) ou `"new-password"` (cadastro), `hint="Pelo menos 8 caracteres."` (cadastro) | Gerenciadores de senha (inclusive o do Android, usado com TalkBack) preenchem e sugerem senhas fortes |

**Botão "Mostrar senha"** ao lado do campo: um `<button type="button">` com `aria-pressed` e texto "Mostrar senha"/"Ocultar senha", que alterna o `type` entre `password` e `text`. **Não use campo "confirmar senha"**: com o botão de mostrar, a pessoa confere o que digitou. Digitar duas vezes é bem mais custoso para quem usa leitor de tela (prática recomendada pelo NIST).

**Validação e erros:**
- Use `noValidate` no `<form>` e valide antes de enviar: campos vazios, e-mail sem `@`, senha com menos de 8 caracteres. As mensagens vão na prop `error` do `Input`, que já anuncia como alerta.
- Erro `400` da API: mostre cada mensagem de `errors.Name`, `errors.Email` e `errors.Password` no campo correspondente.
- Leve o **foco para o primeiro campo com erro**, porque o leitor de tela lê a mensagem junto.
- `409` (cadastro): erro no campo de e-mail, mais um link "Entrar com este e-mail".
- `401` (login): mensagem geral "E-mail ou senha incorretos." num `role="alert"`. Mantenha o e-mail, limpe a senha e leve o foco para ela.
- `429`: mostre a mensagem que vem da API (ela já diz quantos minutos esperar).
- Enquanto envia: botão desabilitado com "Entrando..." / "Criando conta...", para evitar envio duplo.

**Depois de entrar:** vá para o endereço em `?voltar=`, se for seguro (veja abaixo), ou para a lista de baralhos (`routes.decks`).

**Links:** "Ainda não tem conta? **Criar conta**" no login e "Já tem conta? **Entrar**" no cadastro.

**Endereço de retorno seguro (contra "open redirect"):**

```ts
/** Só aceita caminhos internos do site; qualquer outra coisa vai para a lista de baralhos. */
export function destinoSeguro(voltar: string | null): string {
  return voltar && /^\/(?![\\/])/.test(voltar) ? voltar : routes.decks;
}
```

**Por quê:** sem essa checagem, um link como `/entrar/?voltar=https://site-falso.com` mandaria a pessoa, logo depois de digitar a senha, para uma página falsa que pede a senha "de novo". A regra recusa também `//site.com` e `/\site.com`, que o navegador trataria como outro site.

### Passo 6 — Proteger as páginas (`AuthGate`)

No `layout.tsx`, dentro do `AuthProvider`:

- Rotas **públicas**: `/` (landing page), `/entrar/` e `/cadastro/`.
- Em qualquer outra rota: com `status === "carregando"`, mostre um skeleton da página (padrão `Skeleton` + `LoadingStatus` com "Verificando sua sessão..."). Com `"deslogado"`, redirecione para `/entrar/?voltar=<caminho + query atual>`.
- Se alguém **já logado** abrir `/entrar/` ou `/cadastro/`, mande para a lista de baralhos (`routes.decks`).
- Na landing page (`src/app/page.tsx`), os botões "Começar a estudar" e "Começar agora" hoje levam para `routes.decks`. Troque para o cadastro (`/cadastro/`) quando ele existir.

**Importante:** essa proteção é só **experiência de uso**. Quem protege os dados de verdade é a API (sem token não há dados, e o baralho de outra pessoa responde 404). Nunca confie na checagem do frontend como segurança.

### Passo 7 — Logout

1. Chame `POST /api/auth/logout` com o refreshToken. **Por quê:** apagar só no navegador não basta, porque quem tivesse copiado o token ainda poderia usá-lo por 30 dias. O logout no servidor invalida o token.
2. **Mesmo se a chamada falhar** (sem internet), limpe a sessão local. A pessoa pediu para sair.
3. Remover a chave do `localStorage` avisa as outras abas pelo evento `storage` (Passo 4).
4. Vá para `/entrar/` e anuncie "Você saiu da sua conta." num `role="status"`. Para isso, passe a mensagem por `sessionStorage` ou por um parâmetro como `?saiu=1`.

### Passo 8 — Página de perfil (`/perfil/`)

- `h1` "Seu perfil".
- Mostre **Nome**, **E-mail** e **Conta criada em** (data em português com `Intl.DateTimeFormat("pt-BR", { dateStyle: "long" })`).
- Botão **"Sair da conta"** (variante `secondary`, tamanho `lg`, largura total no celular).
- Sem edição por enquanto (a API não tem as rotas). Não coloque botões desabilitados de "em breve": eles poluem a tela e confundem o leitor de tela.

### Passo 9 — Menu burger no cabeçalho

**Por que:** logado, o cabeçalho precisa de Meus baralhos, Perfil, Sair, Ajuda e Tema. Isso não cabe em 375px. Também não cabe quando alguém com baixa visão usa **zoom de 200%**, porque a página fica com cerca de 320px de largura útil (critério WCAG 1.4.10, Reflow).

**Comportamento (padrão "disclosure" do WAI-ARIA):**

```tsx
<button
  type="button"
  className={styles.menuButton}
  aria-expanded={open}
  aria-controls="menu-principal"
  onClick={() => setOpen(!open)}
>
  {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
  <span>{open ? "Fechar" : "Menu"}</span>
</button>

<nav id="menu-principal" aria-label="Menu principal" hidden={!open}>
  <ul>{/* links e botões, um por linha */}</ul>
</nav>
```

- Use `<nav>` com uma lista de links. **Não** use `role="menu"`/`menuitem`: esse padrão é para menus de aplicativo, exige setas do teclado e confunde o leitor de tela num menu de navegação.
- Botão com **texto visível** "Menu"/"Fechar" ao lado do ícone, porque o ícone sozinho é difícil de identificar com baixa visão.
- `Esc` fecha o menu e devolve o foco ao botão. Feche também ao trocar de página (observe o `usePathname`) e ao tocar fora do menu.
- Marque o link da página atual com `aria-current="page"`.

**Itens:**

| Situação | Celular (< 768px) | Desktop (≥ 768px) |
|---|---|---|
| Logado | Fixos: Logo, **Ajuda**, **Menu**. No menu: Meus baralhos, Perfil, Tema, Sair | Tudo em linha: Meus baralhos, Perfil, Ajuda, Tema. "Sair" fica no Perfil |
| Deslogado | Fixos: Logo, **Ajuda**, **Menu**. No menu: Entrar, Criar conta, Tema | Em linha: Entrar, Criar conta, Ajuda, Tema |

"Ajuda" fica sempre visível porque é o ponto de orientação de quem se perdeu.

**Visual:** painel logo abaixo do cabeçalho, com `@include surface` e `border-radius: $radius-lg`. Cada item ocupa a largura toda, com no mínimo **56px** de altura (`$touch-md`) e fonte `$font-size-lg`. Use os tokens de cor e o anel de foco padrão. Se tiver animação, ela precisa respeitar `prefers-reduced-motion`. No tema, use texto ("Tema escuro"/"Tema claro"), não só ícone.

---

## 6. Segurança: checklist

- [ ] accessToken **só em memória**; refreshToken no `localStorage`, e só ele.
- [ ] Nenhum token em URL, `console.log`, mensagem de erro ou analytics. URLs ficam no histórico e nos logs de servidores.
- [ ] Senha nunca é guardada, nem em `localStorage`, nem em estado global depois do envio.
- [ ] Uma renovação por vez, entre abas (`navigator.locks`), lendo o token dentro da trava.
- [ ] Logout chama a API **e** limpa o local, mesmo se a API falhar.
- [ ] `?voltar=` validado com `destinoSeguro()`.
- [ ] Nada de `dangerouslySetInnerHTML` (um XSS poderia roubar o refreshToken do `localStorage`).
- [ ] Mensagens de erro iguais para "e-mail não existe" e "senha errada" (a API já faz isso; não "melhore" o texto).
- [ ] A proteção de páginas no frontend é só experiência de uso; segurança é na API.
- [ ] (Opcional, recomendado) Cabeçalho **Content-Security-Policy** no Static Site do Render (**Settings → Headers**), limitando scripts ao próprio site e conexões à API. Ele reduz o estrago de um eventual XSS.

## 7. Testes antes do PR

- [ ] Cadastro: sucesso; e-mail repetido; senha curta; e-mail inválido; campos vazios.
- [ ] Login: sucesso; senha errada; 5 erradas seguidas (bloqueio de 15 min, mensagem clara).
- [ ] Recarregar a página continua logado; fechar e abrir o navegador também.
- [ ] Renovação: force um accessToken inválido e veja se a próxima chamada renova sozinha. Dica: em desenvolvimento, exponha `window.__cardvozInvalidarToken = () => { accessToken = "invalido"; }` só quando `process.env.NODE_ENV === "development"`.
- [ ] Duas abas abertas: as duas continuam funcionando depois de 15 minutos; logout numa desloga a outra.
- [ ] `/entrar/?voltar=https://exemplo.com` vai para a lista de baralhos depois do login.
- [ ] Logout: o refreshToken antigo não funciona mais (teste no Swagger, em `/api/auth/refresh`).
- [ ] Menu: abre, fecha com `Esc` (foco volta ao botão), fecha ao navegar; leitor de tela anuncia "expandido/recolhido".
- [ ] **TalkBack (Android) e NVDA (Windows)**: formulário lido na ordem certa, erros anunciados, foco no campo com erro.
- [ ] Tela em **375px**, **zoom de 200%** e **tema escuro**; nenhum texto abaixo de 16px.
- [ ] `npm run lint`, `npx tsc --noEmit` e `npm run build` passando.

## 8. Entrega

- Um branch por passo/PR (ex.: `feat/login-ids-string`, `feat/login-sessao`, `feat/login-paginas`, `feat/menu-burger`).
- Commits no padrão do projeto (Conventional Commits em português, ex.: `feat: adicionar página de login`), **sem menções a IA**.
- **Push na `main` publica o site.** Confira que a API em produção já está com a autenticação no ar antes de juntar o Passo 1, senão o site para de funcionar.
- Ao terminar o Passo 3, avise a Élida.
