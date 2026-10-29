# CardVoz — Guia de referência para agentes de IA

Leia este arquivo inteiro antes de alterar o projeto. Ele descreve as regras, a arquitetura, a composição das páginas e o estilo visual do CardVoz, e vale para qualquer ferramenta (Claude Code, Cursor, Copilot, Codex etc.).

O CardVoz é um app de **fichas de estudo (flashcards) para pessoas cegas e com baixa visão**. As usuárias principais estudam com o **leitor de tela nativo do aparelho** (TalkBack no Android, NVDA no Windows) e também usam a visão residual. **Acessibilidade vem antes de qualquer outra decisão**, inclusive estética.

---

## 1. Regras inegociáveis

1. **Sem áudio próprio.** Nunca use `speechSynthesis`, TTS, sons ou leitura automática. O leitor de tela da pessoa já fala; uma segunda voz se sobrepõe e atrapalha. A leitura acontece movendo o **foco** (ver seção 7).
2. **Nada de letra pequena.** O menor texto da interface é **16px** (`$font-size-sm`). Texto corrido é 18px. Use só os tokens `$font-size-*`; nunca escreva tamanhos menores em `px`/`rem`.
3. **Áreas de toque grandes.** Todo botão ou link de ação tem no mínimo **48px** de altura (`$touch-sm`); ações principais usam 56–72px (`$touch-md`, `$touch-lg`). Os botões da tela de estudo têm 88px no celular.
4. **Contraste alto.** Texto precisa de contraste **≥ 7:1** (WCAG AAA) nos dois temas. Use apenas as cores dos tokens (`var(--...)`); se criar um par novo de cores, calcule o contraste antes.
5. **Menos coisas na tela.** A pergunta, a resposta e os botões essenciais são o destaque. Não adicione painéis decorativos, guias fixos, contadores extras, etiquetas de atalho (`<kbd>`) na interface nem textos explicativos longos. A ajuda fica no diálogo **Ajuda** do topo.
6. **O site é estático** (`output: "export"`). Não use nada que dependa de um servidor Next: rotas dinâmicas `[id]`, API routes, `rewrites`, middleware, Server Actions, otimização do `next/image` ou `fetch` em Server Component em tempo de requisição. Os dados vêm da API C# chamada **pelo navegador**.
7. **Commits sem atribuição a IA.** Não adicione `Co-Authored-By`, "Generated with…" ou qualquer menção a IA em commits e PRs. Use a identidade git já configurada no repositório.
8. **Push na `main` publica em produção.** O GitHub Actions valida (lint + build) e dispara o deploy no Render. Não faça push na `main` sem que lint e build passem localmente.

---

## 2. O sistema (4 repositórios)

| Repositório | Papel | Hospedagem |
|---|---|---|
| **CardVoz** (este) | Frontend Next.js exportado como site estático (pasta `out/`) | Render — Static Site |
| **cardvoz-api** | API REST em C# (.NET 9), só PostgreSQL | Render — Web Service (Docker) |
| **cardvoz-db** | Esquema e dados iniciais do banco, como migrations do Supabase CLI | Supabase (PostgreSQL) |
| **cardvoz-admin** | Painel da equipe (Next.js estático): usuários e baralhos compartilhados | Render — Static Site |

- O frontend chama a API em `NEXT_PUBLIC_API_URL` (ex.: `https://cardvoz-api.onrender.com/api`). Essa variável é **gravada no build**: mudou, precisa gerar o site de novo.
- A API libera o domínio do site pela variável `CORS_ALLOWED_ORIGINS` (sem barra no final).
- **A API exige login.** Todas as rotas, exceto `/api/auth/*`, pedem `Authorization: Bearer <accessToken>`, e cada pessoa só acessa os próprios baralhos, fichas e sessões (recurso de outra pessoa responde 404). O fluxo de tokens (acesso de 15 min + renovação de 30 dias com rotação) está documentado no README da `cardvoz-api`, seção "Como o frontend deve usar".
- **Duas formas de entrar:** e-mail e senha (`/entrar/` chama `POST /api/auth/login`; `/cadastro/` chama `POST /api/auth/register`) e Google (fluxo *authorization code* + PKCE, com redirecionamento: o Google devolve a pessoa para `/entrar/` com um código, e a API o troca em `POST /api/auth/google`, com o segredo do cliente que fica só na API). As três devolvem os mesmos tokens próprios. Sem `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no build, o botão do Google some e só o login com senha aparece. Configuração do Google: README, seção "Login com Google".
- **A API não junta contas:** se o e-mail do Google já tem uma conta criada com senha, `/api/auth/google` responde `409` e a pessoa entra com a senha. O cadastro com senha não confirma o e-mail, então juntar as contas deixaria quem cadastrou o e-mail de outra pessoa entrar na conta dela com a própria senha.
- **Os baralhos são privados** de quem os cria. **Baralhos compartilhados** são baralhos sem dono, criados pela equipe no `cardvoz-admin`: não aparecem na lista de ninguém, e em `/baralhos/` (seção "Baralhos prontos") a pessoa adiciona uma cópia aos seus (`getSharedDecks`, `copySharedDeck`). A cópia é independente: editar ou excluir o compartilhado não muda as cópias.
- **Admin:** contas com `isAdmin` entram no `cardvoz-admin` e usam `/api/admin/*`. O site do CardVoz não mostra nada de admin.
- **Todos os IDs são UUID (texto)**, não números.
- Mudança de tabela/coluna começa em **cardvoz-db** (nova migration) e precisa bater com o modelo do Entity Framework da **cardvoz-api**. Os nomes no banco são PascalCase (`"Decks"`, `"Cards"`, `"StudySessions"`, `"StudyReviews"`).

---

## 3. Stack

- **Next.js 15** (App Router) com `output: "export"` e `trailingSlash: true`
- **React 19** + **TypeScript** (strict)
- **SCSS Modules** com tokens próprios (sem Tailwind, sem CSS-in-JS)
- **next-themes** para tema claro/escuro (classe `.dark` no `<html>`)
- **lucide-react** para ícones
- Fontes via `next/font/google`: **Nunito** (títulos e marca) e **Atkinson Hyperlegible** (texto; criada pelo Braille Institute para baixa visão)

---

## 4. Estrutura de pastas

```
src/
├── app/                        # Páginas (todas "use client")
│   ├── layout.tsx              # <html lang="pt-BR">, fontes, ThemeProvider, AuthProvider, SkipLink, Header, AuthGate
│   ├── page.tsx                # /                      Landing page (apresentação do produto, pública)
│   ├── entrar/                 # /entrar/               Entrar com e-mail e senha ou Google; volta do Google (pública)
│   ├── cadastro/               # /cadastro/             Criar conta com nome, e-mail e senha (pública)
│   ├── privacidade/            # /privacidade/          Política de privacidade (pública)
│   ├── perfil/                 # /perfil/               Dados da conta e "Sair da conta"
│   ├── baralhos/               # /baralhos/             Lista de baralhos de quem usa o app
│   │   └── novo/               # /baralhos/novo/        Criar baralho (nome + importação opcional)
│   ├── baralho/                # /baralho/?id=slug      Detalhe do baralho e lista de fichas
│   │   └── adicionar/          # /baralho/adicionar/?id=slug   Escrever fichas ou importar arquivo
│   └── estudar/                # /estudar/?deck=slug    Sessão de estudo
├── components/                 # Um componente por pasta + barrel em index.ts
├── lib/
│   ├── api.ts                  # Cliente da API C# (token, renovação no 401, ApiError)
│   ├── http.ts                 # URL da API, ApiError, errorMessage
│   ├── auth/session.ts         # Tokens, renovação (uma por vez, entre abas), logout
│   ├── auth/google.ts          # Ida ao Google (PKCE + state) e leitura da volta
│   ├── notice.ts               # Aviso que sobrevive a uma troca de página (sessionStorage)
│   ├── routes.ts               # Endereços internos, páginas públicas e safeRedirect
│   └── importCards.ts          # Leitura de fichas de arquivos TXT/CSV/JSON
└── styles/
    ├── _variables.scss         # Tokens SCSS (tipografia, toque, raios, sombras, breakpoints)
    ├── _mixins.scss            # Mixins (surface, back-link, focus-ring, respond-to...)
    └── globals.scss            # Variáveis CSS dos temas claro/escuro + reset
public/modelos/                 # Arquivos de exemplo para importação (TXT, CSV, JSON)
.github/workflows/deploy.yml    # Lint + build e deploy no Render via deploy hook
```

---

## 5. Rotas e navegação

| Rota | Página | Parâmetro |
|---|---|---|
| `/` | Landing page (apresentação do produto), pública | — |
| `/entrar/` | Entrar com e-mail e senha ou com Google, pública. Também recebe a volta do Google (`?code=&state=` ou `?error=`) | `voltar` = caminho interno para depois de entrar |
| `/cadastro/` | Criar conta com nome, e-mail e senha, pública | `voltar`, como em `/entrar/` |
| `/privacidade/` | Política de privacidade, pública | — |
| `/perfil/` | Dados da conta e "Sair da conta" | — |
| `/baralhos/` | Lista de baralhos | — |
| `/baralhos/novo/` | Novo baralho (âncora `#importar` leva à importação) | — |
| `/baralho/?id=<slug>` | Detalhe do baralho | `id` = slug ou id |
| `/baralho/adicionar/?id=<slug>` | Adicionar fichas | `id` = slug ou id |
| `/estudar/?deck=<slug>` | Estudo | `deck` = slug ou id |

- **Sempre gere links com `routes`** (`src/lib/routes.ts`): `routes.deck(slug)`, `routes.addCards(slug)`, `routes.study(slug)`, `routes.newDeck`, `routes.importDeck`, `routes.decks` (lista de baralhos), `routes.home` (landing page), `routes.login`, `routes.loginThenReturn(caminho)`, `routes.register`, `routes.registerThenReturn(caminho)`, `routes.profile` e `routes.privacy`. Não escreva caminhos à mão.
- **Toda página pede login, exceto as de `PUBLIC_PATHS`** (`/`, `/entrar/`, `/cadastro/`, `/privacidade/`). Quem protege é o `<AuthGate>` no layout: página nova já nasce protegida, sem checagem própria. Para criar uma página pública, adicione-a em `PUBLIC_PATHS`.
- Endereço de retorno vindo da URL (`?voltar=`) passa sempre por `safeRedirect()`, que só aceita caminhos internos (evita *open redirect*).
- Dados variáveis (qual baralho) vão na **query string**, nunca em segmentos dinâmicos `[id]`, porque o site é estático.
- Páginas que usam `useSearchParams` **precisam** de `<Suspense>` em volta do conteúdo (exigência do export estático). Padrão: um componente `XContent` com a lógica e o `export default` envolvendo-o em `<Suspense fallback={<XLoading />}>`.
- Nova página: crie `src/app/<rota>/page.tsx` + `page.module.scss` e adicione o endereço em `routes.ts`.

---

## 6. Dados (`src/lib/api.ts`)

- Funções disponíveis: `getDecks`, `getDeck`, `createDeck`, `updateDeck`, `deleteDeck`, `getCategories`, `getCards`, `createCard`, `createCards` (lote, em sequência, preservando a ordem), `updateCard`, `deleteCard`, `getSharedDecks`, `copySharedDeck`, `startStudySession`, `recordStudyReview`, `finishStudySession`, `getStudyHistory`.
- Os tipos (`DeckResponse`, `DeckDetailResponse`, `CardResponse`, `StudySessionResponse`...) espelham os DTOs da API em camelCase. Todos os IDs são `string` (UUID).
- `fetchApi` envia o `accessToken`; num `401`, renova a sessão **uma vez** e repete a chamada. Se a sessão acabou, o `AuthProvider` fica sabendo e o `AuthGate` leva a pessoa para `/entrar/?voltar=<página atual>`.
- **Não há dados de exemplo nem fallback local.** Toda falha vira `ApiError` (`status`, `message`, `fieldErrors` com as chaves da API, como `Title`). `status` 0 = a API nem respondeu. Nunca trate falha como sucesso.
- `getDeck` devolve `null` para 404 (não existe ou não é seu) e lança erro nos outros casos: mostre "não encontrado" e "não carregou" (com "Tentar de novo") como estados diferentes.
- Para a mensagem na tela, use `errorMessage(error, "Texto padrão.")`: ela mostra a mensagem da API quando é falta de conexão ou limite de tentativas, e o texto padrão no resto.
- A API exige `category` ao criar baralho; o frontend envia `"Geral"` e só **exibe** a categoria quando ela for diferente de `"Geral"`.
- O campo `voiceNotes` existe na API, mas **não é exibido** (costumava repetir a resposta como "dica").
- A sessão de estudo é **otimista**: a tela avança na hora e as chamadas à API entram numa fila (`enqueue` em `estudar/page.tsx`).

**Login e sessão** (`src/lib/auth/`, `AuthProvider`, `AuthGate`)
- `accessToken` **só em memória**; `refreshToken` no `localStorage` (`cardvoz.refreshToken`). Nunca coloque token em URL, `console.log` ou mensagem de erro, e não use `dangerouslySetInnerHTML` (um XSS leria o `localStorage`).
- `refreshSession()` garante **uma renovação por vez, inclusive entre abas** (`navigator.locks`), lendo o token dentro da trava. Duas renovações com o mesmo token fazem a API encerrar todas as sessões da pessoa. Não chame `/auth/refresh` por fora dela.
- Sem internet na renovação **não desloga**: o status vira `"erro"` e o `AuthGate` mostra a mensagem com "Tentar de novo".
- `useAuth()` dá `status` (`"carregando" | "logado" | "deslogado" | "erro"`), `user` e `logout()`. Sair numa aba sai em todas (evento `storage`).
- Avisos que precisam aparecer na página seguinte ("Você saiu da sua conta.") vão por `setNotice()`/`takeNotice()` (`src/lib/notice.ts`), e não por `setTimeout` antes de navegar.
- A proteção de páginas no frontend é só experiência de uso; quem protege os dados é a API.

---

## 7. Acessibilidade: padrões já implementados (siga-os)

**Foco que faz o leitor de tela ler sozinho (tela de estudo)**
- A cada nova ficha, o foco vai para o `<h2 tabIndex={-1}>` da pergunta, cujo texto inclui `Pergunta 2 de 10:` (o "2 de 10" fica em `.sr-only`).
- Ao revelar, o foco vai para o `<h2 tabIndex={-1}>` da resposta. Ao terminar, para o `<h1>` do resumo, que traz o resultado em `.sr-only`.
- O CSS global esconde o anel de foco nesses elementos quando o foco veio por script (`[tabindex="-1"]:focus:not(:focus-visible)`), mas mantém o anel para teclado.

**Botões de estudo**
- **"Acertei" fica sempre no mesmo lugar** (direita, presos ao rodapé), antes e depois de revelar, para ser achado pelo toque. O botão da esquerda alterna entre "Ver resposta" e "Errei".
- "Acertei" funciona **sem revelar** a resposta (avanço rápido em revisões).
- Há uma trava de 400ms entre ações (`ACTION_LOCK_MS`) para um toque duplo não marcar "Errei" ou pular uma ficha.
- Atalhos: `Espaço` (ver resposta), `1` (acertei), `2` (errei). Ficam **desligados por padrão**: o leitor de tela também usa teclas soltas (no NVDA, o Espaço pode chegar à página durante a leitura e revelar a resposta sem querer), e a WCAG 2.1.4 exige que atalhos de uma tecla possam ser desligados. A pessoa liga na Ajuda (seção "Atalhos do teclado"); a escolha fica no `localStorage` (`useShortcutsEnabled`/`setShortcutsEnabled` em `src/lib/shortcuts.ts`). Ligados, são ignorados quando o foco está num controle interativo (`isInteractiveTarget`), para não sequestrar o Espaço de um botão. Não crie atalhos de uma tecla novos sem passar por essa preferência.

**Anúncios e estados**
- Mensagens de status usam `role="status"`. Para o leitor anunciar de novo, o texto precisa mudar (ex.: "1ª ficha salva", "2ª ficha salva").
- Erros de formulário usam a prop `error` de `Input`/`Textarea` (renderiza `role="alert"`) e o foco vai para o campo com problema. Formulários usam `noValidate` com mensagens próprias em português.
- **Carregamento:** skeleton visual com `aria-hidden` + `<LoadingStatus>` com o texto anunciado ("Carregando baralho..."). O skeleton imita o layout final para a tela não "pular".
- **Login:** formulário de e-mail e senha primeiro ("Entrar", variante `primary`, `lg`), depois "ou" e o `GoogleButton` (variante `secondary`, `lg`, redirecionamento da página inteira). Não use o botão oficial do Google (iframe que não controlamos) nem o One Tap (abre sozinho e atrapalha o leitor de tela).
- **Senha:** sempre com `PasswordInput`, que tem "Mostrar senha" (o leitor de tela não lê o que foi digitado num campo de senha). Use `autoComplete="current-password"` para entrar e `"new-password"` para criar a conta, para o gerenciador de senhas funcionar. Sem campo "confirmar senha": o "Mostrar senha" cumpre esse papel.
- **Botão de enviar do login e do cadastro:** `aria-disabled` e uma trava no envio, em vez de `disabled`. Um botão desativado perde o foco, e o leitor de tela ficaria sem posição se der erro.
- **Diálogos:** use sempre o componente `<Dialog>` (elemento nativo `<dialog>` com `showModal`): foco preso, `Esc` e anúncio corretos. Não crie modais com `div role="dialog"`.

**Rótulos**
- Quando um botão repete o mesmo texto em vários itens, use `aria-label` que **contenha o texto visível** (WCAG 2.5.3): "Estudar Biologia Celular", "Ver fichas de Biologia Celular".
- Ícones do lucide sempre com `aria-hidden="true"`; botão só com ícone precisa de `aria-label`.
- Uma página tem **um** `<h1>`; a hierarquia de títulos não pula níveis.
- `<html lang="pt-BR">`, skip link para `#main-content` e `prefers-reduced-motion` já estão configurados globalmente.

---

## 8. Composição das páginas

Toda página segue o mesmo esqueleto:

```tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, LoadingStatus, Skeleton } from "@/components";
import { errorMessage, getDeck, type DeckDetailResponse } from "@/lib/api";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

function BackLink() {
  return (
    <nav aria-label="Navegação estrutural">
      <Link href={routes.decks} className={styles.backLink}>
        <ArrowLeft aria-hidden="true" />
        <span>Meus baralhos</span>
      </Link>
    </nav>
  );
}

// Mesmo layout da página pronta, com blocos no lugar do conteúdo
function ExemploLoading() {
  return (
    <main id="main-content" className={styles.main}>
      <BackLink />
      <LoadingStatus>Carregando baralho...</LoadingStatus>
      <div className={styles.panel} aria-hidden="true">
        <Skeleton width="60%" height="2.5rem" />
      </div>
    </main>
  );
}

function ExemploContent() {
  const id = useSearchParams().get("id") || "";
  const [deck, setDeck] = useState<DeckDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getDeck(id)
      .then(setDeck)
      .catch((error) => setLoadError(errorMessage(error, "Não foi possível carregar o baralho.")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ExemploLoading />;
  if (loadError) {
    return (
      <main id="main-content" className={styles.main}>
        <BackLink />
        <h1 className={styles.title}>O baralho não carregou</h1>
        <p role="alert">{loadError}</p>
        <Button onClick={() => window.location.reload()} variant="primary">Tentar de novo</Button>
      </main>
    );
  }
  if (!deck) {
    return (
      <main id="main-content" className={styles.main}>
        <BackLink />
        <h1 className={styles.title}>Baralho não encontrado</h1>
        <Button href={routes.decks} variant="primary">Voltar aos meus baralhos</Button>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.main}>
      <BackLink />
      <h1 className={styles.title}>{deck.title}</h1>

      {/* Feedback de ações: fica visível quando tem texto e é anunciado ao leitor de tela */}
      <p role="status" className={statusMessage ? styles.status : "sr-only"}>
        {statusMessage}
      </p>

      <section className={styles.panel} aria-labelledby="secao-titulo">
        <h2 id="secao-titulo" className={styles.panelTitle}>Seção</h2>
        {/* conteúdo */}
      </section>

      <div className={styles.actions}>
        <Button variant="primary" size="lg" block onClick={() => setStatusMessage("Pronto.")}>
          Ação principal
        </Button>
        <Button href={routes.deck(deck.slug)} variant="ghost" size="md" block>
          Cancelar
        </Button>
      </div>
    </main>
  );
}

// useSearchParams exige Suspense no site estático
export default function ExemploPage() {
  return (
    <Suspense fallback={<ExemploLoading />}>
      <ExemploContent />
    </Suspense>
  );
}
```

- `<main id="main-content">` com largura máxima conforme o tipo: formulários `40rem`, estudo `44rem`, detalhe `52rem`, lista `1120px`. Margens laterais de `1rem` no celular.
- Link de voltar (`@include back-link`) no topo, `<h1>` logo abaixo.
- Conteúdo agrupado em painéis com `@include surface` e `border-radius: $radius-xl`.
- Ações empilhadas em largura total no celular (`block`); lado a lado a partir de `sm`.
- **Estados obrigatórios** de qualquer tela com dados: carregando (skeleton), vazio (mensagem + ação para começar), não encontrado (mensagem + voltar), erro ao carregar (mensagem em `role="alert"` + "Tentar de novo") e feedback de sucesso/erro em `role="status"`.
- A página não precisa checar login: o `AuthGate` só a mostra com a pessoa logada (use `useAuth().user` se precisar dos dados da conta).
- Na tela de estudo, `main` ocupa a altura da tela (`.studyMain`) e os botões ficam em uma barra `position: sticky; bottom: 0`.

---

## 9. Estilo visual

**Personalidade:** leve, amigável e arredondada — fundo creme, azul acolhedor, sombras difusas, bastante respiro. **Evite** a estética de "painel de IA": fonte monoespaçada, rótulos em MAIÚSCULAS, bordas em tudo, chips de tecla, ícones decorativos em excesso.

**Tipografia**
- Títulos e marca: Nunito 800 (`$font-family-heading`). Texto: Atkinson Hyperlegible (`$font-family-base`), que só tem os pesos **400 e 700**.
- Escala: `$font-size-sm` 16px (mínimo) · `base` 18px (texto) · `lg` 20px (botões, rótulos) · `xl` 24px · `2xl` 30px · `3xl` 36px · `4xl` 44px. Pergunta do estudo: 28px no celular, 34px no desktop.

**Tokens SCSS** (`_variables.scss`)
- Toque: `$touch-sm` 48px · `$touch-md` 56px · `$touch-lg` 72px
- Raios: `$radius-sm` 12px · `md` 16px (campos) · `lg` 24px (itens, botões grandes) · `xl` 32px (painéis) · `full` (botões em pílula)
- Sombras: use `var(--shadow-soft)` e `var(--shadow-raised)` (mudam com o tema)
- Breakpoints (mobile-first, `min-width`): `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px — via `@include respond-to(sm)`

**Cores** (variáveis CSS em `globals.scss`, redefinidas em `.dark`)

| Variável | Uso |
|---|---|
| `--bg`, `--surface`, `--surface-soft` | Fundo da página, painéis, áreas secundárias |
| `--border`, `--border-strong` | Contorno de painéis; contorno de campos |
| `--ink`, `--text-primary`, `--text-muted` | Títulos; texto; texto secundário (todos ≥ 7:1) |
| `--primary`, `--primary-hover`, `--primary-fg` | Ação principal ("Ver resposta", "Estudar", "Criar") |
| `--primary-soft`, `--primary-soft-text` | Botões suaves, Ajuda, destaques |
| `--success`, `--success-fg`, `--success-soft*` | "Acertei" e mensagens de sucesso |
| `--danger-soft`, `--danger-text` | "Errei" e exclusão (tom suave, sem alarme) |
| `--answer-bg` | Fundo da resposta revelada |
| `--ring` | Anel de foco (3px, com afastamento de 3px) |
| `--skeleton`, `--skeleton-shine` | Blocos de carregamento |

- **Nunca** coloque cores hexadecimais em componentes; use as variáveis. Exceções já existentes: tons das iniciais de baralho (`DeckCard`), a ficha de trás do logotipo (`Logo`) e os tons decorativos da landing page (`page.tsx` da raiz e `LandingDemo`).
- Todo estilo novo precisa funcionar nos **dois temas**.

**Mixins** (`_mixins.scss`): `surface` (painel arredondado com borda e sombra), `soft-label` (rótulos como "Pergunta"), `back-link`, `focus-ring`, `sr-only`, `respond-to($bp)`.

---

## 10. Componentes (`src/components`)

| Componente | Uso |
|---|---|
| `Button` | Botão ou link (`href`). Variantes: `primary`, `secondary`, `soft`, `ghost`, `danger`, `success`. Tamanhos: `sm` 48px, `md` 56px, `lg` 72px. `block` = largura total |
| `Input`, `Textarea` | Campo com `label`, `error` (alerta) e `hint` |
| `PasswordInput` | `Input` de senha com a caixa "Mostrar senha" |
| `GoogleButton` | "Entrar com Google" de `/entrar/` e `/cadastro/`. Não aparece sem `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| `Dialog` | Modal nativo com título, conteúdo e `footer` de ações |
| `HelpDialog` | Ajuda com seções recolhíveis; abre na seção da tela atual |
| `Header` | Logo, Ajuda e botão **Menu** (padrão *disclosure*, `<nav>` com lista, sem `role="menu"`) abaixo de `md`; links em linha (Meus baralhos, Perfil ou Entrar) e tema a partir de `md`. Esc fecha o menu e devolve o foco; fecha ao trocar de página e ao tocar fora |
| `AuthProvider`, `useAuth` | Contexto da sessão: `status`, `user`, `logout()`, `retry()`. Restaura a sessão ao abrir o site |
| `AuthGate` | No layout: protege as páginas fora de `PUBLIC_PATHS` (skeleton enquanto confere, redireciona para `/entrar/`, erro com "Tentar de novo") |
| `DeckCard`, `DeckCardSkeleton` | Cartão de baralho da lista de baralhos e sua versão de carregamento |
| `LandingDemo` | Demonstração da landing page: 3 fichas de exemplo com o mesmo comportamento da tela de estudo |
| `FileImport` | Seleção de arquivo TXT/CSV/JSON com prévia; não salva nada (a página decide) |
| `Skeleton`, `LoadingStatus` | Bloco de carregamento decorativo + texto anunciado ao leitor de tela |
| `Kbd` | Tecla de atalho — usado só dentro da Ajuda |
| `Logo`, `LogoIcon` | Marca: pilha de fichas com barras de voz. `compact` mostra só o ícone abaixo de `sm` (usado no cabeçalho). O vão entre as fichas é uma máscara SVG, então funciona sobre qualquer fundo e em uma cor só. Arquivos da marca em `docs/logo/` |
| `SkipLink`, `ThemeToggle`, `ThemeProvider` | Estrutura global. `ThemeToggle variant="menu"` é a linha "Tema escuro" (com `aria-pressed`) do menu do celular |
| `Badge`, `Card`, `cn()` (`lib/utils`) | Existem, mas **não são usados**; prefira o mixin `surface` e template strings |

---

## 11. Convenções de código

- Um componente por pasta: `Nome/Nome.tsx` + `Nome.module.scss` + `index.ts`, exportado também em `components/index.ts`. Exportações nomeadas.
- Imports com o alias `@/` (`@/components`, `@/lib/api`).
- SCSS de cada módulo começa com `@use "<caminho>/styles/variables" as *;` e `@use "<caminho>/styles/mixins" as *;`.
- Estilos **mobile-first**: o padrão é o celular (375px) e `respond-to(...)` amplia.
- Sem estilos inline, exceto valores dinâmicos (ex.: largura da barra de progresso).
- Comentários em **português**, explicando o porquê, não o óbvio.
- Toda a interface em **português do Brasil**.

---

## 12. Textos da interface

- Tom próximo e direto, com "você"; frases curtas; botões começam com verbo.
- Vocabulário fixo: **baralho**, **ficha**, **pergunta**, **resposta**, **Estudar**, **Ver resposta**, **Acertei**, **Errei**, **Novo baralho**, **Adicionar fichas**, **Importar arquivo**, **Ajuda**.
- Mensagens de erro dizem o que fazer: "Escreva um nome para o baralho." em vez de "Campo inválido".

---

## 13. Importação de arquivos (`src/lib/importCards.ts`)

- **TXT:** uma ficha por linha (`pergunta; resposta`, também TAB ou `|`), blocos separados por linha em branco, ou linhas `P:` / `R:`.
- **CSV:** vírgula ou ponto e vírgula (padrão do Excel em português), com ou sem cabeçalho (`pergunta`/`resposta`, `question`/`answer`, `frente`/`verso`).
- **JSON:** lista de fichas ou `{ "titulo": "...", "fichas": [...] }`.
- Limites: 2 MB e 1000 fichas. Exemplos em `public/modelos/`.

---

## 14. Fluxo de trabalho

```bash
npm run dev           # desenvolvimento (http://localhost:3000)
npm run lint          # ESLint
npx tsc --noEmit      # tipos
npm run build         # gera o site estático em out/
npx serve out         # pré-visualiza o resultado do build
```

- Desenvolvimento local: `.env.local` com `NEXT_PUBLIC_API_URL=http://localhost:5000/api` e `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, e a `cardvoz-api` rodando com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. O endereço `http://localhost:3000/entrar/` precisa estar cadastrado no cliente OAuth do Google.
- **Antes de concluir uma mudança:** lint, tipos e build passando; tela conferida em **375px** e **320px** (zoom de 200%) de largura, sem rolagem horizontal, e no **tema escuro**; navegação por teclado funcionando; nenhum texto abaixo de 16px.
- **Commits:** Conventional Commits em português (`feat:`, `fix:`, `refactor:`, `chore:`, `ci:`), **sem atribuição a IA**.

---

## 15. Pontos de atenção conhecidos

- **Ordem de publicação de mudanças de login:** migration no `cardvoz-db` → API → site. O site chama rotas que precisam existir na API.
- **Google em modo de teste:** se o app OAuth estiver "Em teste" no Google Cloud, só entram os e-mails cadastrados como usuários de teste. Publique o app ou cadastre cada participante antes dos testes.
- **Navegadores dentro de apps** (Instagram e parecidos) são bloqueados pelo Google (`disallowed_useragent`). A Ajuda orienta abrir no Chrome.
- **API "dormindo" no Render (plano gratuito):** a primeira chamada depois de um tempo parado pode levar ~1 minuto. Durante esse tempo a tela mostra "Verificando sua sessão...".
- **Limite por IP na API:** 10/min para login com senha e 60/min para Google, renovação e logout. Numa rede compartilhada (Wi-Fi da escola) todos dividem o mesmo IP.
- **Excluir conta e exportar dados** ainda não existem (a política de privacidade orienta pedir à equipe).
- **Não há "Esqueci minha senha"** nem confirmação de e-mail no cadastro: os dois dependem de a API enviar e-mails, o que ainda não existe.
- O comando `next lint` está obsoleto a partir do Next 15.5; ao migrar para o Next 16, troque pelo ESLint direto.
