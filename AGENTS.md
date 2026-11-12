# CardVoz — Guia de referência para agentes de IA

Leia este arquivo inteiro antes de alterar o projeto. Ele descreve as regras, a arquitetura, a composição das páginas e o estilo visual do CardVoz, e vale para qualquer ferramenta (Claude Code, Cursor, Copilot, Codex etc.).

O CardVoz é um app de **fichas de estudo (flashcards) para pessoas cegas e com baixa visão**. As usuárias principais estudam com o **leitor de tela nativo do aparelho** (TalkBack no Android, NVDA no Windows) e também usam a visão residual. **Acessibilidade vem antes de qualquer outra decisão**, inclusive estética.

---

## 1. Regras inegociáveis

1. **Sem áudio próprio.** Nunca use `speechSynthesis`, TTS, sons ou leitura automática. O leitor de tela da pessoa já fala; uma segunda voz se sobrepõe e atrapalha. A leitura acontece movendo o **foco** (ver seção 7).
2. **Nada de letra pequena.** O menor texto da interface é **16px** (`$font-size-sm`). Texto corrido é 18px. Use só os tokens `$font-size-*`; nunca escreva tamanhos menores em `px`/`rem`.
3. **Áreas de toque grandes.** Todo botão ou link de ação tem no mínimo **48px** de altura (`$touch-sm`); ações principais usam 56–72px (`$touch-md`, `$touch-lg`). Os botões da tela de estudo têm 88px no celular.
4. **Contraste alto.** Texto precisa de contraste **≥ 7:1** (WCAG AAA) nos dois temas. Use apenas as cores dos tokens (`var(--...)`); se criar um par novo de cores, calcule o contraste antes. Confira também sobre os fundos suaves (`--primary-soft`, `--success-soft`, `--danger-soft`), e não só sobre o fundo da página. Contornos de campos e controles precisam de **≥ 3:1** (WCAG 1.4.11): é por eles que a pessoa com baixa visão acha onde tocar. Botão sem fundo forte leva contorno visível: `--border-strong` (secundário, Menu, tema, Fechar), `--primary-soft-text` (suave, Ajuda) ou `--danger-text` (excluir). O `src/styles/contrast.test.ts` confere os pares de cores a cada `npm test`; par novo entra na lista dele.
5. **Menos coisas na tela.** A pergunta, a resposta e os botões essenciais são o destaque. Não adicione painéis decorativos, guias fixos, contadores extras, etiquetas de atalho (`<kbd>`) na interface nem textos explicativos longos. A ajuda fica no diálogo **Ajuda** do topo.
6. **O site é estático** (`output: "export"`). Não use nada que dependa de um servidor Next: rotas dinâmicas `[id]`, API routes, `rewrites`, middleware, Server Actions, otimização do `next/image` ou `fetch` em Server Component em tempo de requisição. Os dados vêm da API C# chamada **pelo navegador**.
7. **Commits sem atribuição a IA.** Não adicione `Co-Authored-By`, "Generated with…" ou qualquer menção a IA em commits e PRs. Use a identidade git já configurada no repositório.
8. **Push na `main` publica em produção.** O GitHub Actions valida (lint + build) e dispara o deploy no Render. Nunca faça push direto na `main`: trabalhe numa branch e abra PR (seção 16), com lint e build passando localmente.

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
- **A conta é opcional no site.** Sem login, baralhos, fichas e estudo ficam só no aparelho (`localStorage`). Com login, os baralhos da conta também ficam guardados no aparelho (cópias) e as mudanças vão para a API por uma fila. Ver seção 6.
- **A API exige login.** Todas as rotas, exceto `/api/auth/*`, pedem `Authorization: Bearer <accessToken>`, e cada pessoa só acessa os próprios baralhos, fichas e sessões (recurso de outra pessoa responde 404). O fluxo de tokens (acesso de 15 min + renovação de 30 dias com rotação) está documentado no README da `cardvoz-api`, seção "Como o frontend deve usar".
- **Duas formas de entrar:** e-mail e senha (`/entrar/` chama `POST /api/auth/login`; `/cadastro/` chama `POST /api/auth/register`) e Google (fluxo *authorization code* + PKCE, com redirecionamento: o Google devolve a pessoa para `/entrar/` com um código, e a API o troca em `POST /api/auth/google`, com o segredo do cliente que fica só na API). As três devolvem os mesmos tokens próprios. Sem `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no build, o botão do Google some e só o login com senha aparece. Configuração do Google: README, seção "Login com Google".
- **A API só junta contas com o e-mail confirmado:** o cadastro com senha manda um link de confirmação (`/confirmar-email/#codigo=...`; confirmar é opcional). Com o e-mail confirmado, entrar com o Google no mesmo endereço liga o Google à conta com senha. Sem confirmar, `/api/auth/google` responde `409` e a mensagem orienta entrar com a senha e confirmar o e-mail no Perfil (botão "Enviar link de confirmação"). Juntar sem confirmar deixaria quem cadastrou o e-mail de outra pessoa entrar na conta dela com a própria senha.
- **Os baralhos são privados** de quem os cria. **Baralhos compartilhados** são baralhos sem dono, criados pela equipe no `cardvoz-admin`: não aparecem na lista de ninguém, e em `/baralhos/` (seção "Baralhos prontos") a pessoa adiciona uma cópia aos seus (`getSharedDecks`, `copySharedDeck`). A cópia é independente: editar ou excluir o compartilhado não muda as cópias. A cópia guarda `sourceDeckId`, e a seção mostra "Já está nos seus baralhos." no lugar do botão.
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
│   ├── data/index.ts           # O que as páginas usam: ler/mudar baralhos (aparelho + fila), sincronizar, hooks
│   ├── data/transfer.ts        # Levar para a conta, repetidos, converter cópias ao sair
│   ├── local/                  # localStorage: storage.ts, decks.ts, queue.ts (fila), account.ts (conta ativa)
│   ├── exportDecks.ts          # Exportar baralhos em JSON (mesmo formato da importação)
│   ├── install.ts              # Cartão "Instalar o CardVoz" (regras e janela do Android)
│   ├── languages.ts            # Idiomas das fichas e langAttr() para o atributo lang
│   ├── searchCards.ts          # Busca de fichas (sem acentos) e texto do anúncio de resultados
│   ├── http.ts                 # URL da API, ApiError, errorMessage
│   ├── auth/session.ts         # Tokens, renovação (uma por vez, entre abas), logout
│   ├── auth/google.ts          # Ida ao Google (PKCE + state) e leitura da volta
│   ├── routes.ts               # Endereços internos, páginas públicas e safeRedirect
│   └── importCards.ts          # Leitura de fichas de arquivos TXT/CSV/JSON
└── styles/
    ├── _variables.scss         # Tokens SCSS (tipografia, toque, raios, sombras, breakpoints)
    ├── _mixins.scss            # Mixins (surface, back-link, focus-ring, respond-to...)
    └── globals.scss            # Variáveis CSS dos temas claro/escuro + reset
public/modelos/                 # Arquivos de exemplo para importação (TXT, CSV, JSON)
public/manifest.webmanifest     # App instalável (ícones em public/icones/)
scripts/gerar-sw.mjs            # Gera out/sw.js (abrir sem internet) depois do next build
scripts/conferir-telas.mjs      # npm run telas: rolagem lateral, texto < 16px e diálogos no celular (Perfil com API simulada)
.github/workflows/deploy.yml    # Lint + build e deploy no Render via deploy hook
.github/workflows/testes.yml    # Cartões de teste: um issue por teste do TESTES-PENDENTES.md (scripts em .github/scripts/)
```

---

## 5. Rotas e navegação

| Rota | Página | Parâmetro |
|---|---|---|
| `/` | Landing page (apresentação do produto), pública | — |
| `/entrar/` | Entrar com e-mail e senha ou com Google, pública. Também recebe a volta do Google (`?code=&state=` ou `?error=`) | `voltar` = caminho interno para depois de entrar |
| `/cadastro/` | Criar conta com nome, e-mail e senha, pública | `voltar`, como em `/entrar/` |
| `/esqueci-senha/` | Pedir o link de nova senha por e-mail, pública | — |
| `/redefinir-senha/` | Criar a nova senha com o código do link, pública | `#codigo=` (depois do `#`, não vai a servidor nenhum) |
| `/confirmar-email/` | Confirma o e-mail sozinha ao abrir o link, pública | `#codigo=` |
| `/privacidade/` | Política de privacidade, pública | — |
| `/perfil/` | Dados da conta e "Sair da conta" | — |
| `/baralhos/` | Lista de baralhos | — |
| `/baralhos/novo/` | Novo baralho (âncora `#importar` leva à importação) | — |
| `/baralho/?id=<slug>` | Detalhe do baralho | `id` = slug ou id |
| `/baralho/adicionar/?id=<slug>` | Adicionar fichas | `id` = slug ou id |
| `/estudar/?deck=<slug>` | Estudo | `deck` = slug ou id; `so=revisar` = Revisar agora (erradas e as da data de revisão) |

- **Sempre gere links com `routes`** (`src/lib/routes.ts`): `routes.deck(slug)`, `routes.addCards(slug)`, `routes.study(slug)`, `routes.review(slug)` (Revisar agora), `routes.newDeck`, `routes.importDeck`, `routes.decks` (lista de baralhos), `routes.home` (landing page), `routes.login`, `routes.loginThenReturn(caminho)`, `routes.register`, `routes.registerThenReturn(caminho)`, `routes.forgotPassword`, `routes.resetPassword`, `routes.confirmEmail`, `routes.profile` e `routes.privacy`. Não escreva caminhos à mão.
- **Toda página pede login, exceto as de `PUBLIC_PATHS`** (`/`, `/entrar/`, `/cadastro/`, `/esqueci-senha/`, `/redefinir-senha/`, `/confirmar-email/`, `/privacidade/` e as de baralhos e estudo: `/baralhos/`, `/baralhos/novo/`, `/baralho/`, `/baralho/adicionar/`, `/estudar/`). Hoje só `/perfil/` é protegida. Quem protege é o `<AuthGate>` no layout: página nova já nasce protegida, sem checagem própria. Para criar uma página pública, adicione-a em `PUBLIC_PATHS`.
- Endereço de retorno vindo da URL (`?voltar=`) passa sempre por `safeRedirect()`, que só aceita caminhos internos (evita *open redirect*). Ela resolve o endereço com `new URL`, como o navegador: conferir só os primeiros caracteres deixa passar `/%09/site.com` (o navegador apaga o tab e lê `//site.com`).
- Dados variáveis (qual baralho) vão na **query string**, nunca em segmentos dinâmicos `[id]`, porque o site é estático.
- Páginas que usam `useSearchParams` **precisam** de `<Suspense>` em volta do conteúdo (exigência do export estático). Padrão: um componente `XContent` com a lógica e o `export default` envolvendo-o em `<Suspense fallback={<XLoading />}>`.
- Nova página: crie `src/app/<rota>/page.tsx` + `page.module.scss` e adicione o endereço em `routes.ts`.

---

## 6. Dados (`src/lib/data`, `src/lib/local` e `src/lib/api.ts`)

**As páginas não chamam `@/lib/api` para baralhos:** usam `@/lib/data`. Tudo é lido do aparelho (`cardvoz.baralhos.v1`) e as escritas são síncronas:
- `useDecks()` / `useDeck(id)` (hooks que se atualizam sozinhos), `listDecks`, `findDeck`, `createDeck`, `renameDeck`, `deleteDeck`, `addCards`, `editCard`, `deleteCard`, `saveStudyResult`, `listSharedDecks`, `copySharedDeck`, `announce(texto)` (aviso global).
- Cada baralho guardado tem `kind`: `"aparelho"` (só no aparelho) ou `"conta"` (cópia de um baralho da conta ativa). Mudança numa cópia da conta entra na **fila** (`cardvoz.fila.v1`), enviada em ordem por `syncAccount()` quando há sessão e internet; depois as cópias são atualizadas com a conta. O aviso da fila aparece no `SyncStatus` (layout).
- Sem internet com sessão salva (`status "erro"`), continua no modo conta (cópias e fila). A conta ativa fica em `cardvoz.conta.v1` (sem token).
- Ids de baralhos criados sem internet mudam quando a fila os envia; o id antigo fica em `aliases` e o endereço antigo continua abrindo o baralho.
- Se o mesmo baralho for editado em dois aparelhos, vale a última alteração enviada (decisão do grupo).
- Ao entrar, `AccountTransfer` pergunta se leva os baralhos do aparelho para a conta; ao sair, `LogoutDialog` pergunta se mantém ou apaga as cópias. Sessão que termina sozinha vale como "manter". Regras em `data/transfer.ts`.
- Rotas da parte 4 (`importDeck`, `getDeckChanges`, `completeStudySession`) vão com o id gerado no aparelho (`id`): a API responde 200 com o que já salvou se o mesmo pedido chegar de novo. Desde a 0.11.0 não há caminho antigo: erro dessas rotas é erro de verdade (`ApiError`).
- Esse 200 traz o baralho **como foi salvo na primeira vez**, sem o que mudou depois. Por isso, depois de todo `importDeck`, `reconcileCreated` (`local/queue.ts`) compara o que voltou com o que deveria estar na conta e põe as diferenças (fichas que faltam, fichas excluídas, nome, idioma) no começo da fila. Nunca apaga o baralho da conta para recomeçar: outro aparelho pode já tê-lo estudado.
- Estudar não conta como edição. Num baralho que veio da conta e está só no aparelho (depois de sair mantendo as cópias), as rodadas ficam em `offAccountStudies` e entram na fila quando ele volta para a conta (`relinkUnchanged`).

**Cliente da API (`src/lib/api.ts`)**

- Funções disponíveis: `getDecks`, `getDeck`, `createDeck`, `updateDeck`, `deleteDeck`, `getCategories`, `getCards`, `createCard`, `updateCard`, `deleteCard`, `getSharedDecks`, `copySharedDeck`, `getStudyHistory`, `importDeck`, `getDeckChanges`, `completeStudySession`, `exportAccount`, `deleteAccount`.
- Os tipos (`DeckResponse`, `DeckDetailResponse`, `CardResponse`, `StudySessionResponse`...) espelham os DTOs da API em camelCase. Todos os IDs são `string` (UUID).
- `fetchApi` envia o `accessToken`; num `401`, renova a sessão **uma vez** e repete a chamada. Se a sessão acabou, o `AuthProvider` fica sabendo e o `AuthGate` leva a pessoa para `/entrar/?voltar=<página atual>`.
- **Não há dados de exemplo nem fallback local.** Toda falha vira `ApiError` (`status`, `message`, `fieldErrors` com as chaves da API, como `Title`). `status` 0 = a API nem respondeu. Nunca trate falha como sucesso.
- `getDeck` devolve `null` para 404 (não existe ou não é seu) e lança erro nos outros casos: mostre "não encontrado" e "não carregou" (com "Tentar de novo") como estados diferentes.
- Para a mensagem na tela, use `errorMessage(error, "Texto padrão.")`: ela mostra a mensagem da API quando é falta de conexão ou limite de tentativas, e o texto padrão no resto.
- A API exige `category` ao criar baralho; o frontend envia `"Geral"` e só **exibe** a categoria quando ela for diferente de `"Geral"`.
- O campo `voiceNotes` existe na API, mas **não é exibido** (costumava repetir a resposta como "dica").
- O estudo não fala com a API durante a rodada: no fim, `saveStudyResult` soma os acertos e erros nas fichas do aparelho (sempre, com ou sem conta) e, com conta, põe a sessão inteira na fila; a API soma os mesmos números. Estudar não muda o `updatedAt` do baralho; quem avisa que os números mudaram em outro aparelho é o `lastStudiedAt`.
- **Acertos e erros** (`src/lib/studyStats.ts`): cada ficha tem `correctCount`, `incorrectCount`, `lastAnsweredAt` e `lastWasCorrect` (opcionais no aparelho). **Revisão espaçada** (caixa de Leitner): `reviewLevel` (0 a 6) e `nextReviewAt`; "Errei" volta a 0 (revisar na hora), "Acertei" sobe um nível (1 dia, 3 dias, 1 semana, 2 semanas, 1 mês, 3 meses). A tabela `REVIEW_INTERVALS_MS` é a mesma de `Card.ReviewIntervals` na API: mude as duas. "Revisar agora" (`routes.review`, `?so=revisar`; o antigo `?so=erradas` continua valendo) usa `dueCards`; fichas antigas sem nível passam por `reviewState`. A lista mostra `dueCount` de cada baralho. Fichas criadas com conta vão para a API sem números (o estudo delas segue na fila como item próprio; mandar os dois contaria duas vezes); só "Levar para a conta" envia o histórico (`statsPayload`). A cópia da conta só é atualizada quando não há nada dela na fila (`hasPendingFor`), para um estudo ainda não enviado não ser apagado.

**Login e sessão** (`src/lib/auth/`, `AuthProvider`, `AuthGate`)
- `accessToken` **só em memória**; `refreshToken` no `localStorage` (`cardvoz.refreshToken`). Nunca coloque token em URL, `console.log` ou mensagem de erro, e não use `dangerouslySetInnerHTML` (um XSS leria o `localStorage`).
- `refreshSession()` garante **uma renovação por vez, inclusive entre abas** (`navigator.locks`), lendo o token dentro da trava. Duas renovações com o mesmo token fazem a API encerrar todas as sessões da pessoa. Não chame `/auth/refresh` por fora dela.
- Sem internet na renovação **não desloga**: o status vira `"erro"` e o `AuthGate` mostra a mensagem com "Tentar de novo".
- `useAuth()` dá `status` (`"carregando" | "logado" | "deslogado" | "erro"`), `user` e `logout()`. Sair numa aba sai em todas (evento `storage`).
- Avisos que precisam aparecer depois de trocar de página ("Você saiu da sua conta.", "Baralho excluído.") vão por `announce()` (`@/lib/data`), mostrado pelo `SyncStatus` do layout, e não por `setTimeout` antes de navegar.
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
- **Avisos do modo sem login:** `LocalNotice` (lista, sem conta) e `SyncStatus` (fila, global) usam texto visível sem foco automático. O único diálogo que abre sozinho é o "Levar para sua conta?", logo depois de entrar. O cartão `InstallCard` aparece na lista depois do primeiro estudo e nunca rouba o foco.
- **Diálogos:** use sempre o componente `<Dialog>` (elemento nativo `<dialog>` com `showModal`): foco preso, `Esc` e anúncio corretos. Não crie modais com `div role="dialog"`.

**Rótulos**
- Quando um botão repete o mesmo texto em vários itens, use `aria-label` que **contenha o texto visível** (WCAG 2.5.3): "Estudar Biologia Celular", "Ver fichas de Biologia Celular", "Excluir ficha 2: Qual organela...".
- **Idioma:** texto de ficha em outro idioma leva `lang` (`langAttr()` de `src/lib/languages.ts`), conforme o "Idioma das fichas" do baralho (`questionLang`/`answerLang`; `null` = português, sem marcar). Trecho estrangeiro fixo na interface também leva `lang` (WCAG 3.1.2).
- **Mensagens de confirmação** se explicam sozinhas, porque são ouvidas sem o contexto visual: "Ficha 2 de “Biologia” atualizada.", e não "Salvo com sucesso".
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
- Páginas de baralho funcionam com e sem login: leia e mude dados por `@/lib/data` e use `useAuth().status` só para o que depende da conta (ex.: baralhos prontos, "Levar para a conta").
- Na tela de estudo, `main` ocupa a altura da tela (`.studyMain`) e os botões ficam em uma barra `position: sticky; bottom: 0`.

---

## 9. Estilo visual

**Personalidade:** leve, amigável e arredondada — fundo creme, azul acolhedor, sombras difusas, bastante respiro. **Evite** a estética de "painel de IA": fonte monoespaçada, rótulos em MAIÚSCULAS, bordas em tudo, chips de tecla, ícones decorativos em excesso.

**Tipografia**
- Títulos e marca: Nunito 800 (`$font-family-heading`). Texto: Atkinson Hyperlegible (`$font-family-base`), que só tem os pesos **400 e 700**.
- Escala: `$font-size-sm` 16px (mínimo) · `base` 18px (texto) · `lg` 20px (botões, rótulos) · `xl` 24px · `2xl` 30px · `3xl` 36px · `4xl` 44px. Pergunta do estudo: 28px no celular, 34px no desktop.

**Tokens SCSS** (`_variables.scss`)
- Toque: `$touch-sm` 48px · `$touch-md` 56px · `$touch-lg` 72px
- Raios: `$radius-xs` 4px (foco de links no meio do texto) · `$radius-sm` 12px · `md` 16px (campos) · `lg` 24px (itens, botões grandes) · `xl` 32px (painéis) · `full` (botões em pílula)
- Sombras: use `var(--shadow-soft)` e `var(--shadow-raised)` (mudam com o tema)
- Breakpoints (mobile-first, `min-width`): `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px — via `@include respond-to(sm)`

**Cores** (variáveis CSS em `globals.scss`, redefinidas em `.dark`)

| Variável | Uso |
|---|---|
| `--bg`, `--surface`, `--surface-soft` | Fundo da página, painéis, áreas secundárias |
| `--border`, `--border-strong` | Contorno de painéis (decorativo); contorno de campos e controles (≥ 3:1) |
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
| `HelpDialog` | Ajuda com todos os assuntos abertos (títulos `h3`); o da tela atual vem primeiro |
| `Header` | Logo, Ajuda e botão **Menu** (padrão *disclosure*, `<nav>` com lista, sem `role="menu"`) abaixo de `md`; links em linha (Meus baralhos, Perfil ou Entrar) e tema a partir de `md`. Esc fecha o menu e devolve o foco; fecha ao trocar de página e ao tocar fora |
| `AuthProvider`, `useAuth` | Contexto da sessão: `status`, `user`, `logout()`, `retry()`. Restaura a sessão ao abrir o site |
| `AuthGate` | No layout: protege as páginas fora de `PUBLIC_PATHS` (skeleton enquanto confere, redireciona para `/entrar/`, erro com "Tentar de novo") |
| `Select` | Lista de opções nativa com `label` e `hint`, no visual do `Input` |
| `Instituicao` | "IFTO, *Campus* Palmas" com o itálico padrão |
| `SyncStatus` | Aviso global da fila de alterações e mensagens de `announce()` (`role="status"`) |
| `LocalNotice` | Aviso fixo na lista: baralhos só neste aparelho / sessão terminou |
| `AccountTransfer` | Diálogos "Levar para sua conta?" e de repetidos (montado no layout; o botão do baralho usa `requestTransfer`) |
| `LogoutDialog` | "Sair da conta": manter ou apagar os baralhos do aparelho |
| `DeleteAccountDialog` | "Excluir conta" do Perfil: confirma com o e-mail e a senha |
| `InstallCard`, `ServiceWorkerRegister` | Sugestão de instalar na tela inicial; registro do service worker e da janela de instalação do Android |
| `DeckCard`, `DeckCardSkeleton` | Cartão de baralho da lista e sua versão de carregamento. O título não é link (seriam duas paradas para o mesmo lugar no leitor de tela): botões Estudar, Revisar agora (quando há fichas da vez) e Ver fichas |
| `LandingDemo` | Demonstração da landing page: 3 fichas de exemplo com o mesmo comportamento da tela de estudo |
| `FileImport` | Seleção de arquivo TXT/CSV/JSON com prévia; não salva nada (a página decide) |
| `Skeleton`, `LoadingStatus` | Bloco de carregamento decorativo + texto anunciado ao leitor de tela |
| `Kbd` | Tecla de atalho — usado só dentro da Ajuda |
| `Logo`, `LogoIcon` | Marca: pilha de fichas com barras de voz. `compact` mostra só o ícone abaixo de `sm` (usado no cabeçalho). O vão entre as fichas é uma máscara SVG, então funciona sobre qualquer fundo e em uma cor só. Arquivos da marca em `docs/logo/` |
| `SkipLink`, `ThemeToggle`, `ThemeProvider` | Estrutura global. `ThemeToggle variant="menu"` é a linha "Tema escuro" (com `aria-pressed`) do menu do celular |

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
- **_Campus_** sempre com inicial maiúscula e em itálico. Na interface, use o componente `<Instituicao />` ("IFTO, *Campus* Palmas").
- Mensagens de erro dizem o que fazer: "Escreva um nome para o baralho." em vez de "Campo inválido".

---

## 13. Importação de arquivos (`src/lib/importCards.ts`)

- **TXT:** uma ficha por linha (`pergunta; resposta`, também TAB ou `|`), blocos separados por linha em branco, ou linhas `P:` / `R:`.
- **CSV:** vírgula ou ponto e vírgula (padrão do Excel em português), com ou sem cabeçalho (`pergunta`/`resposta`, `question`/`answer`, `frente`/`verso`).
- **JSON:** lista de fichas ou `{ "titulo": "...", "fichas": [...] }`. O arquivo exportado pelo CardVoz leva também o histórico de cada ficha estudada (`acertos`, `erros`, `ultimaResposta`, `acertouUltima`, `nivelRevisao`, `proximaRevisao`), lido de volta na importação; valores estranhos são ignorados.
- Limites: 2 MB e 1000 fichas. Exemplos em `public/modelos/`.

---

## 14. Fluxo de trabalho

```bash
npm run dev           # desenvolvimento (http://localhost:3000)
npm run lint          # ESLint
npx tsc --noEmit      # tipos
npm test              # Vitest (lógica de src/lib e scripts/)
npm run build         # gera o site estático em out/ e o service worker out/sw.js
npx serve out         # pré-visualiza o resultado do build
npm run telas         # confere todas as telas no celular (com o site rodando; ver README)
```

- Desenvolvimento local: `.env.local` com `NEXT_PUBLIC_API_URL=http://localhost:5000/api` e `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, e a `cardvoz-api` rodando com `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. O endereço `http://localhost:3000/entrar/` precisa estar cadastrado no cliente OAuth do Google.
- **Antes de concluir uma mudança:** lint, tipos, testes e build passando; `npm run telas` sem problemas (sem rolagem lateral de 320 a 412px, nenhum texto abaixo de 16px, diálogos dentro da tela); tela conferida também à mão no **tema escuro** e com zoom de 200%; navegação por teclado funcionando. Se a mudança cria uma tela ou um diálogo novo, inclua-o em `PAGINAS` ou `DIALOGOS` do script.
- **Testes à mão viram cartões (issues):** o `TESTES-PENDENTES.md` é só a fonte dos cartões, compacto: "## seção", "> antes de testar" (opcional), "### Tnn – título (vX.Y.Z)", "F: o que fazer" e "E: o que deve acontecer", uma linha cada, escritos para quem não é de TI; pergunta é "### Pn – título" e "?: pergunta". Quando o arquivo muda na `main`, a Action "Cartões de teste" (`.github/workflows/testes.yml`) cria um cartão por teste novo, com as caixas "✅ Passou" e "❌ Falhou", e fecha os cartões dos testes que saíram do arquivo. Para ler as respostas: `node .github/scripts/ler-resultados.js`; para tirar os que passaram: `node .github/scripts/apagar-testes.js T03 T05`. Teste novo vai no fim, com número novo (nunca reaproveitado); só apague um teste com "Passou" no cartão.
- **Commits:** Conventional Commits em português (`feat:`, `fix:`, `refactor:`, `chore:`, `ci:`), **sem atribuição a IA**.
- **Textos de apoio em toda mudança:** confira e atualize junto o `README.md`, as **perguntas frequentes** (`DUVIDAS` em `src/app/page.tsx`), a **Ajuda** (`HelpDialog`), o `docs/guia-de-uso.md`, este `AGENTS.md` e o `CHANGELOG.md`. Se nenhum precisou mudar, diga isso no PR.
- **Branch e PR:** trabalhe numa branch (`feat/...`, `fix/...`, `docs/...`) e abra PR para a `main` de `gvtenberg/cardvoz`; o merge na `main` publica no Render. Depois do deploy, confira a versão no rodapé. Regras completas do fluxo (ordem entre repositórios e o que informar ao terminar) na seção 16.
- **Outros repositórios:** `cardvoz-api` e `cardvoz-db` têm dono no grupo (`fiuzaheitor`). Combine antes de alterar e descreva a tarefa em `docs/tarefas/` do repositório. Hoje a API e o banco são publicados a partir dos forks `gvtenberg/...` (seção 16).
- **Idioma de trabalho:** respostas, comentários, commits e documentação em português do Brasil.
- **Versão:** ao publicar, suba o `version` do `package.json` (funcionalidade nova sobe o MINOR, só correção sobe o PATCH) e registre no `CHANGELOG.md`. O rodapé da página inicial e a Ajuda mostram "Versão X (commit)" (`src/lib/version.ts`, valores gravados no build pelo `next.config.mjs`), para conferir o deploy no Render sem entrar na conta.

---

## 15. Pontos de atenção conhecidos

- **Ordem de publicação de mudanças de login:** migration no `cardvoz-db` → API → site. O site chama rotas que precisam existir na API.
- **Google em modo de teste:** se o app OAuth estiver "Em teste" no Google Cloud, só entram os e-mails cadastrados como usuários de teste. Publique o app ou cadastre cada participante antes dos testes.
- **Navegadores dentro de apps** (Instagram e parecidos) são bloqueados pelo Google (`disallowed_useragent`). A Ajuda orienta abrir no Chrome.
- **API "dormindo" no Render (plano gratuito):** a primeira chamada depois de um tempo parado pode levar ~1 minuto. Durante esse tempo a tela mostra "Verificando sua sessão...".
- **Limite por IP na API:** 10/min para login com senha e 60/min para Google, renovação e logout. Numa rede compartilhada (Wi-Fi da escola) todos dividem o mesmo IP.
- **Baixar meus dados e Excluir conta** ficam no Perfil (`DeleteAccountDialog`, `exportAccount`/`deleteAccount`). Excluir pede o e-mail e, se a conta tiver senha (`user.hasPassword`), a senha; depois tira as cópias da conta do aparelho.
- **Dados no aparelho:** limpar os dados do navegador apaga os baralhos que estão só no aparelho. Mudar o formato do que fica no `localStorage` exige nova chave (`.v2`) e migração; dados inválidos vão para `<chave>.corrompido` em vez de quebrar a tela.
- **Service worker:** depois de publicar, quem já abriu o site recebe a versão nova na próxima visita com internet. Para testar offline, use o build (`npx serve out`), não o `npm run dev`.
- **"Esqueci minha senha"** (`/esqueci-senha/` e `/redefinir-senha/#codigo=...`) depende do SMTP configurado na API (sem ele, a tela mostra a mensagem do 503). O código vem depois do `#` e a página o tira da barra de endereço. A confirmação de e-mail usa o mesmo SMTP.
- O comando `next lint` está obsoleto a partir do Next 15.5; ao migrar para o Next 16, troque pelo ESLint direto.
- **Fileira de botões no celular:** mais de dois botões lado a lado passam da largura da tela. A página ganha rolagem lateral e, como o `<dialog>` mede a largura pela página, os diálogos abertos nela também passam da tela, com o "Fechar" escondido (issues #10 e #11). Empilhe em coluna no celular e só ponha lado a lado a partir de `sm`, com `flex-wrap`. Nomes longos sem espaço (links colados numa ficha) quebram a linha por causa do `overflow-wrap` do `body`; num item de `flex`, use também `min-width: 0`.

---

## 16. Combinados da equipe

Estas regras vieram de conversas da equipe com assistentes de IA e valem para todo mundo, use ou não uma ferramenta de IA. Os `AGENTS.md` da `cardvoz-api` e do `cardvoz-db` têm a mesma seção, adaptada a cada repositório.

- **Português do Brasil** em respostas, comentários, commits, PRs e documentação. Quando a pessoa disser que entendeu, siga para o próximo passo sem repetir a explicação.
- **Textos de apoio em toda mudança:** antes de dar uma mudança por concluída, confira README, perguntas frequentes, Ajuda, guia de uso, `AGENTS.md`, `CHANGELOG.md` e a versão no `package.json` (seção 14). No resumo ou no PR, diga o que mudou neles ou que não precisou.
- **Quem usa o CardVoz:** a cliente é cega e estuda com o TalkBack; o público inclui pessoas com baixa visão. Letras grandes, contraste AAA e as recomendações da WCAG valem mais que qualquer escolha visual (seção 1). Digitar e-mail e senha no TalkBack é trabalhoso: por isso existe o modo sem login.
- **Trabalho dividido:** cada repositório tem dono no grupo. Mudança de código na `cardvoz-api` ou no `cardvoz-db` só depois de combinar; descreva a tarefa em `docs/tarefas/` do repositório. Os PRs vão para os repositórios de publicação (abaixo).
- **Fluxo de branch e PR (vale para pessoas e para qualquer agente de IA):**
  - **Nunca faça push direto na `main`.** Commits numa branch (`feat/...`, `fix/...`, `docs/...`), push para o repositório de publicação e PR para a `main` dele. Quem faz o merge é uma pessoa da equipe, pelo PR.
  - **Repositórios de publicação (nov/2026):** site `gvtenberg/cardvoz` e API `gvtenberg/cardvoz-api` (o merge na `main` publica no Render); banco `gvtenberg/cardvoz-db` (a migration vai ao Supabase com `npx supabase db push --remote`, antes do merge da API que a usa); painel `gvtenberg/cardvoz-admin` (fork do `fiuzaheitor/cardvoz-admin`, criado em nov/2026 para publicar no Render). Os repositórios `fiuzaheitor/cardvoz-api` e `fiuzaheitor/cardvoz-db` são os originais: não abra PR neles sem combinar com o dono. Ao abrir PR a partir de um fork, confira o **base repository**: o GitHub sugere o original.
  - **Mudança que depende de outra:** um PR por repositório, na ordem **banco → API → site → painel**, e cada PR diz do que depende.
  - **Ao terminar** (resposta de um agente de IA, mensagem no grupo ou descrição do PR), informe sempre, no mesmo formato: (1) o que foi enviado, com repositório e branch; (2) os links dos PRs, numerados na ordem de merge; (3) o que cada merge publica; (4) o que precisa ser configurado ou feito à mão (migration, variáveis de ambiente, Google Cloud, Render). Sem a ferramenta `gh`, o link do PR é `https://github.com/<dono>/<repo>/compare/main...<branch>?expand=1` (dá para preencher `&title=` e `&body=`). A pessoa não deve precisar perguntar o que foi feito.
- **Problemas de tela viram issue** no GitHub do site, com captura e o aparelho usado (ex.: "Galaxy S25+ no modo de celular do Firefox"). O commit que corrige cita a issue (`Closes #10`), e ela fecha sozinha quando o PR entra na `main`.
- **Histórico de pedidos da cliente (out/2026):** modo sem login (partes 1 a 3 publicadas na 0.5.0; a parte 4, três rotas na API para reduzir chamadas, foi implementada em nov/2026 na branch `feat/estatisticas-das-fichas` da `cardvoz-api`, junto com os acertos e erros); leitura contínua com o TalkBack (0.6.0); Ajuda aberta e privacidade (0.7.0); busca e idioma das fichas (0.8.0; o idioma vai para a conta desde a 0.10.0, pelo item de fila `idiomaBaralho`); "Como montar o arquivo" antes do seletor, contraste revisado, acertos e erros por baralho (cada baralho é uma matéria) e "Estudar só as que errei" (0.9.0, nov/2026). Designs em `docs/superpowers/specs/`.
