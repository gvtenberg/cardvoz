# Modo sem login — Plano de implementação (partes 1, 2 e 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objetivo:** o CardVoz funciona sem login, com os baralhos guardados no aparelho, cópias dos baralhos da conta para estudar e editar sem internet, levar para a conta ao entrar, abrir offline e instalar na tela inicial.

**Arquitetura:** tudo o que a tela mostra vem do `localStorage` (fonte da verdade da interface). Uma camada `src/lib/data/` decide, a cada escrita, se ela fica só no aparelho ou entra numa fila que vai para a API quando há conta e internet. A conta é sincronizada em segundo plano (fila primeiro, depois atualização das cópias). Um service worker gerado depois do build guarda o site para abrir sem internet.

**Tecnologias:** Next.js 15 (`output: "export"`), React 19, TypeScript strict, SCSS Modules, Vitest (novo, só `devDependency`, só para `src/lib`), `sharp` (já instalado pelo Next, usado uma vez para gerar os ícones).

**Spec:** `docs/superpowers/specs/2026-10-30-modo-sem-login-design.md` — leia antes. Leia também o `AGENTS.md` inteiro.

## Restrições globais

- Tudo em português do Brasil: interface, comentários, nomes de chaves de armazenamento, mensagens de commit (Conventional Commits, **sem atribuição a IA**).
- Site estático: nada de rotas dinâmicas, API routes, middleware.
- Sem áudio próprio. Leitura acontece movendo o foco ou por `role="status"`; para reanunciar, o texto precisa mudar.
- Texto ≥ 16px (`$font-size-*`), toque ≥ 48px (`$touch-*`), contraste ≥ 7:1, só cores `var(--...)`, dois temas.
- Diálogos só com `<Dialog>`. Botões de envio com `aria-disabled` + trava, não `disabled`, onde o foco precisa ficar.
- Nenhum diálogo ou aviso abre sozinho roubando o foco, exceto o diálogo "Levar para a conta" logo depois de entrar.
- Token nunca em URL, `console.log` ou mensagem. `refreshSession()` continua a única porta de renovação.
- `cardvoz-api` e `cardvoz-db` não mudam neste plano (a parte 4 é de outra pessoa). O site usa rotas novas da parte 4 só se existirem (404/405 → caminho antigo).
- Chaves do `localStorage`, todas com `.v1`: `cardvoz.baralhos.v1`, `cardvoz.fila.v1`, `cardvoz.conta.v1`, `cardvoz.instalar.v1`, `cardvoz.primeiroEstudo.v1`.
- Textos fixos da spec (copiar exatamente):
  - Aviso da lista: "Seus baralhos estão só neste aparelho. Entre na sua conta para guardá-los."
  - Aviso de sessão encerrada: "Sua sessão terminou. Seus baralhos continuam neste aparelho. Entre de novo para guardá-los na conta."
  - Fila: "Sem internet. {n} alterações serão enviadas quando você se conectar." (1 → "1 alteração será enviada…") e "Alterações enviadas para sua conta."
  - Levar: título "Levar para sua conta?", texto "Você tem {n} baralhos neste aparelho. Levar para sua conta?", botões "Levar para a conta" / "Agora não".
  - Repetidos: "Já existe “{título}” na sua conta." com "Ficar com o do aparelho" / "Ficar com o da conta" / "Manter os dois". Aviso: "Ficar com o do aparelho apaga o histórico de estudo deste baralho na conta."
  - Sair: "Os baralhos da sua conta estão guardados neste aparelho. Quem usar este aparelho poderá vê-los." com "Manter neste aparelho" / "Apagar deste aparelho".
  - Prontos sem login: "Entre na sua conta para ver os baralhos prontos."
  - Instalar: "Instalar o CardVoz", "Agora não" (7 dias), "Não mostrar mais"; iPhone: "Toque em Compartilhar e depois em Adicionar à Tela de Início."
- "Manter os dois" leva o baralho como "{título} (do aparelho)".

## Pontos de atenção na revisão

1. **Duas abas abertas** escrevendo no `localStorage`: cada operação relê o armazenamento antes de gravar (nunca grava um estado guardado em memória). Teste na Tarefa 2.
2. **Abrir sem internet com sessão salva** (`status === "erro"`): a pessoa continua no modo conta (cópias visíveis, edições na fila). Não pode ser tratada como "saiu" (isso converteria as cópias). Teste na Tarefa 4.
3. **Envio para a conta interrompido** (app fechado no meio): retomar sem duplicar baralho nem fichas. Teste na Tarefa 10.
4. **JSON salvo corrompido ou de outro formato:** o app não quebra; guarda o texto original em `<chave>.corrompido` e segue vazio. Teste na Tarefa 1.
5. **Endereço antigo depois que o id muda** (baralho criado offline e enviado, ou levado para a conta): `/baralho/?id=<id antigo>` continua abrindo o baralho. Teste na Tarefa 2.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `vitest.config.ts`, `src/test/setup.ts` | Vitest em Node, alias `@/`, `localStorage`/`sessionStorage` em memória |
| `src/lib/local/storage.ts` | Ler/gravar JSON versionado, espaço cheio, dados corrompidos, aviso de mudança |
| `src/lib/local/decks.ts` | Baralhos e fichas guardados no aparelho (tipos `LocalDeck`, `LocalCard`) |
| `src/lib/local/account.ts` | Conta ativa (id, nome, e-mail) guardada no aparelho |
| `src/lib/local/queue.ts` | Fila de alterações da conta: guardar, juntar, enviar |
| `src/lib/data/index.ts` | O que as páginas usam: leituras, escritas, sincronização, hooks |
| `src/lib/data/transfer.ts` | Parte 2: religar, levar para a conta, repetidos, converter ao sair |
| `src/lib/exportDecks.ts` | Exportar um ou todos os baralhos em JSON |
| `src/lib/install.ts` | Parte 3: preferências do cartão de instalação e evento do Android |
| `src/components/SyncStatus/` | Anúncio global da fila (`role="status"`) |
| `src/components/AccountTransfer/` | Diálogos "Levar para a conta" e repetidos, montado no layout |
| `src/components/LogoutDialog/` | Diálogo de sair |
| `src/components/LocalNotice/` | Aviso fixo da lista (aparelho ou sessão encerrada) |
| `src/components/InstallCard/` | Cartão "Instalar o CardVoz" |
| `src/components/ServiceWorkerRegister/` | Registra o service worker e guarda o evento de instalação |
| `scripts/gerar-sw.mjs`, `scripts/sw-modelo.js` | Gera `out/sw.js` depois do build |
| `public/manifest.webmanifest`, `public/icones/*.png` | App instalável |

As páginas deixam de importar `@/lib/api` e passam a importar `@/lib/data` (exceto `entrar`, `cadastro`, `perfil` e os tipos).

---

## Parte 1 — Dados no aparelho e páginas sem login

### Tarefa 1: Vitest e armazenamento local

**Arquivos:**
- Modificar: `package.json` (devDependency `vitest`; scripts `"test": "vitest run"`), `.github/workflows/deploy.yml` (passo `- run: npm test` entre lint e build)
- Criar: `vitest.config.ts`, `src/test/setup.ts`, `src/lib/local/storage.ts`, `src/lib/local/storage.test.ts`
- Modificar: `src/lib/http.ts` (`errorMessage` devolve a mensagem de `StorageFullError`)

**Interfaces — produz:**
```ts
export class StorageFullError extends Error {} // message: "O espaço do navegador acabou. Exporte seus baralhos e apague os que não usa."
export function readJson<T>(key: string, fallback: T, isValid: (v: unknown) => v is T): T;
export function writeJson(key: string, value: unknown): void; // lança StorageFullError
export function removeKey(key: string): void;
export function onLocalChange(listener: (key: string) => void): () => void; // mesma aba (CustomEvent "cardvoz:local") e outras abas (evento storage)
export function requestPersistentStorage(): void; // navigator.storage?.persist?.(), uma vez por carregamento
```

- [ ] **Passo 1:** `npm i -D vitest`; criar `vitest.config.ts` (environment `node`, `setupFiles: ["src/test/setup.ts"]`, alias `@` → `src`, `include: ["src/**/*.test.ts"]`). `setup.ts` define `globalThis.localStorage` e `sessionStorage` com uma classe `MemoryStorage` (Map) e limpa os dois em `beforeEach`; define `globalThis.window = globalThis` com `addEventListener`/`dispatchEvent` de um `EventTarget`.
- [ ] **Passo 2: testes que falham** (`storage.test.ts`):
  - `readJson` sem chave → `fallback`.
  - grava `{a:1}` e lê de volta.
  - valor `"{quebrado"` → devolve `fallback` e `localStorage.getItem("k.corrompido") === "{quebrado"`.
  - valor JSON válido que falha em `isValid` → mesmo comportamento de corrompido.
  - `setItem` que lança `DOMException` com `name: "QuotaExceededError"` → `writeJson` lança `StorageFullError`.
  - `onLocalChange` recebe a chave depois de `writeJson`; o retorno remove o ouvinte.
  - `errorMessage(new StorageFullError(), "x")` devolve a mensagem do espaço cheio.
- [ ] **Passo 3:** `npm test` → FALHA.
- [ ] **Passo 4:** implementar.
- [ ] **Passo 5:** `npm test` → PASSA; `npm run lint` e `npx tsc --noEmit` sem erros.
- [ ] **Passo 6:** commit `chore: adicionar testes com vitest e armazenamento local`

### Tarefa 2: Baralhos guardados no aparelho

**Arquivos:** criar `src/lib/local/decks.ts`, `src/lib/local/decks.test.ts`

**Interfaces — consome:** Tarefa 1. **Produz:**
```ts
export interface LocalCard { id: string; question: string; answer: string; displayOrder: number; createdAt: string }
export interface AccountLink {
  userId: string;
  remoteId: string;                 // id do baralho na API
  remoteUpdatedAt: string | null;   // updatedAt da API na última atualização
}
export interface LocalDeck {
  id: string;            // id nas rotas: o da API para cópias da conta, crypto.randomUUID() para os do aparelho
  aliases: string[];     // ids antigos (antes de ir para a API) — continuam abrindo o baralho
  title: string; category: string; description: string | null;
  sourceDeckId: string | null;
  createdAt: string; updatedAt: string;
  cards: LocalCard[];
  kind: "aparelho" | "conta";       // "conta" = cópia de um baralho da conta ativa
  account: AccountLink | null;      // em "conta": sempre; em "aparelho": de qual conta veio (depois de sair), ou null
  editedOffAccount: boolean;        // "aparelho" vindo de conta, editado depois de sair
  upload: { remoteId: string } | null; // envio para a conta em andamento (Tarefa 10)
}
export const DECKS_KEY = "cardvoz.baralhos.v1";
export function listLocalDecks(): LocalDeck[];                         // mais novos primeiro (createdAt)
export function findLocalDeck(idOrSlug: string): LocalDeck | null;     // id, alias
export function saveLocalDeck(deck: LocalDeck): void;                  // insere ou substitui por id (relendo o armazenamento)
export function updateLocalDeck(id: string, change: (d: LocalDeck) => LocalDeck): LocalDeck | null;
export function removeLocalDeck(id: string): void;
export function newDeviceDeck(data: { title: string; category?: string; cards?: { question: string; answer: string }[] }): LocalDeck; // cria e salva; category padrão "Geral"
export function fromApiDeck(d: DeckDetailResponse, userId: string): LocalDeck; // kind "conta"
export function toDeckResponse(d: LocalDeck): DeckResponse & { kind: LocalDeck["kind"] };      // slug = id, cardCount = cards.length
export function toDeckDetail(d: LocalDeck): DeckDetailResponse & { kind: LocalDeck["kind"] };  // cards → CardResponse com deckId = d.id
```

- [ ] **Passo 1: testes que falham:**
  - `newDeviceDeck({title:"Bio", cards:[{question:"a",answer:"b"}]})` → `kind "aparelho"`, `cards[0].displayOrder === 1`, encontrado por `findLocalDeck(id)`.
  - `findLocalDeck("antigo")` acha o baralho com `aliases: ["antigo"]` (**ponto 5**).
  - **duas abas (ponto 1):** salvar A; gravar B direto no `localStorage` (simulando outra aba); `saveLocalDeck(A editado)` → a lista final tem A editado **e** B.
  - `fromApiDeck` copia `id`, `title`, fichas na ordem de `displayOrder`, `account.remoteId === id`, `remoteUpdatedAt === updatedAt ?? null`.
  - `toDeckResponse` → `cardCount` igual ao número de fichas e `slug === id`.
  - armazenamento com item inválido (sem `cards`) → descartado sem quebrar a lista (valida item a item).
- [ ] **Passo 2:** `npm test` → FALHA. **Passo 3:** implementar. **Passo 4:** `npm test` → PASSA.
- [ ] **Passo 5:** commit `feat: guardar baralhos no aparelho`

### Tarefa 3: Conta ativa, fila e rotas novas da API

**Arquivos:**
- Criar: `src/lib/local/account.ts`, `src/lib/local/queue.ts`, `src/lib/local/queue.test.ts`
- Modificar: `src/lib/api.ts`

**Interfaces — produz:**
```ts
// account.ts
export interface SavedAccount { id: string; name: string; email: string }
export const ACCOUNT_KEY = "cardvoz.conta.v1";
export function getSavedAccount(): SavedAccount | null;
export function saveAccount(a: SavedAccount): void;
export function clearSavedAccount(): void;

// queue.ts
export type QueueItem = { id: string; createdAt: string } & (
  | { type: "criarBaralho"; deckId: string; title: string; category: string; cards: { localId: string; question: string; answer: string }[] }
  | { type: "renomearBaralho"; deckId: string; title: string }
  | { type: "excluirBaralho"; deckId: string }
  | { type: "criarFicha"; deckId: string; localId: string; question: string; answer: string; displayOrder: number }
  | { type: "editarFicha"; deckId: string; cardId: string; question: string; answer: string }
  | { type: "excluirFicha"; deckId: string; cardId: string }
  | { type: "estudo"; deckId: string; startedAt: string; completedAt: string; answers: { cardId: string; wasCorrect: boolean; answeredAt: string }[] }
);
export const QUEUE_KEY = "cardvoz.fila.v1"; // { userId: string; items: QueueItem[] }
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never; // definido em queue.ts
export function enqueue(userId: string, item: DistributiveOmit<QueueItem, "id" | "createdAt">): void;
export function pendingCount(userId: string): number;
export function hasPendingFor(userId: string, deckId: string): boolean;
export function clearQueue(): void;
export interface QueueResult { sent: number; failures: string[]; stoppedOffline: boolean; stoppedSession: boolean }
export function processQueue(userId: string, api: QueueApi): Promise<QueueResult>;
export type QueueApi = Pick<typeof import("@/lib/api"),
  "createDeck" | "importDeck" | "updateDeck" | "deleteDeck" | "createCard" | "updateCard" | "deleteCard" | "saveStudySession">;

// api.ts — acrescentar
export class RouteMissingError extends Error {}
/** POST /decks/import (parte 4). Lança RouteMissingError em 404/405. */
export function importDeck(data: { title: string; category: string; description?: string; cards: { question: string; answer: string }[] }): Promise<DeckDetailResponse>;
/** GET /decks/changes?since= (parte 4). Lança RouteMissingError em 404/405. */
export function getDeckChanges(since: string | null): Promise<{ decks: DeckDetailResponse[]; allIds: string[]; serverTime: string }>;
/** POST /study-sessions/complete (parte 4); se a rota não existir, usa start + review por resposta + finish. */
export function saveStudySession(data: { deckId: string; startedAt: string; completedAt: string; answers: { cardId: string; wasCorrect: boolean; answeredAt: string }[] }): Promise<void>;
```
Rotas ausentes ficam lembradas num `Set` do módulo para não repetir a tentativa na mesma visita. `recordStudyReview` deixa de chamar `GET /study-sessions/{id}` e passa a devolver `Promise<void>` (ninguém usa o retorno).

**Regras de `enqueue` (juntar antes de gravar):**
- `excluirBaralho` de um baralho que tem `criarBaralho` na fila → remove todos os itens daquele `deckId` e não enfileira nada.
- `excluirFicha` de uma ficha cujo `criarFicha` (ou entrada em `criarBaralho.cards`) ainda está na fila → remove os dois.
- `editarFicha` de ficha ainda não enviada → altera o `criarFicha`/`cards` pendente em vez de criar item.
- `criarFicha` num baralho com `criarBaralho` pendente → acrescenta em `criarBaralho.cards`.
- Fila de outro `userId` gravada → é descartada antes de enfileirar (não deveria acontecer; a Tarefa 12 limpa ao sair).

**Regras de `processQueue`:**
- Uma aba por vez: `navigator.locks.request("cardvoz-fila", …)` quando existir; senão roda direto.
- Em ordem. Sucesso → remove o item e grava (um por vez, para sobreviver a fechar o app).
- `criarBaralho`: tenta `importDeck`; `RouteMissingError` → `createDeck` + `createCard` por ficha. Depois troca o id local pelo da API **nos itens seguintes da fila e no `LocalDeck`** (`id` novo, id antigo em `aliases`, `account.remoteId`), e os ids das fichas também.
- `criarFicha`: troca `localId` pelo id da API nos itens seguintes e no `LocalDeck`.
- `ApiError` status 0 → para, `stoppedOffline: true`. 401 → para, `stoppedSession: true`.
- 404 → descarta o item e adiciona em `failures` uma frase: "A ficha “{pergunta curta}” não existe mais na sua conta." / "O baralho “{título}” não existe mais na sua conta."
- 400 e outros → descarta e adiciona "Não foi possível enviar uma alteração de “{título}”."

- [ ] **Passo 1: testes que falham** (`queue.test.ts`, com `QueueApi` falso feito de `vi.fn()`):
  - criar baralho offline e excluir antes de enviar → fila vazia.
  - criar ficha e editar antes de enviar → um único item com o texto editado.
  - `processQueue` com `criarBaralho` + `renomearBaralho` → chama `importDeck` e depois `updateDeck` **com o id da API**; o `LocalDeck` passa a ter o id da API e o antigo em `aliases`.
  - `importDeck` lança `RouteMissingError` → usa `createDeck` + `createCard` na ordem.
  - API falsa lança `ApiError(0)` no 2º item → `sent: 1`, `stoppedOffline: true`, 2º item continua na fila.
  - 404 em `editarFicha` → item descartado, `failures.length === 1`, segue com o próximo.
  - `pendingCount` e `hasPendingFor` refletem a fila.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar `account.ts`, `queue.ts` e as funções de `api.ts`. **Passo 4:** PASSA; `npx tsc --noEmit` ok.
- [ ] **Passo 5:** commit `feat: fila de alterações para a conta`

### Tarefa 4: Camada de dados e anúncio da fila

**Arquivos:**
- Criar: `src/lib/data/index.ts`, `src/lib/data/index.test.ts`, `src/components/SyncStatus/{SyncStatus.tsx,SyncStatus.module.scss,index.ts}`
- Modificar: `src/components/AuthProvider/AuthProvider.tsx`, `src/app/layout.tsx`, `src/components/index.ts`

**Interfaces — consome:** Tarefas 1–3. **Produz:**
```ts
export type DeckItem = DeckResponse & { kind: "aparelho" | "conta" };
export type DeckDetail = DeckDetailResponse & { kind: "aparelho" | "conta" };
export function setActiveAccount(a: SavedAccount | null): void;  // chamada pelo AuthProvider
export function getActiveAccount(): SavedAccount | null;
export function setOnline(canSync: boolean): void;             // true quando status "logado"
// leituras (síncronas, do aparelho)
export function listDecks(): DeckItem[];
export function findDeck(idOrSlug: string): DeckDetail | null;
// escritas: no aparelho já; em cópia da conta, também na fila + syncAccount()
export function createDeck(data: { title: string; cards?: { question: string; answer: string }[] }): DeckItem;
export function renameDeck(id: string, title: string): void;
export function deleteDeck(id: string): void;
export function addCards(deckId: string, cards: { question: string; answer: string }[]): void;
export function editCard(deckId: string, cardId: string, data: { question: string; answer: string }): void;
export function deleteCard(deckId: string, cardId: string): void;
export function saveStudyResult(deckId: string, r: { startedAt: string; answers: { cardId: string; wasCorrect: boolean; answeredAt: string }[] }): void; // "aparelho": não guarda nada
// conta
export function syncAccount(): Promise<SyncResult>;  // fila primeiro; depois atualiza cópias
export function fetchDeckFromAccount(idOrSlug: string): Promise<DeckDetail | null>; // não achou no aparelho e há conta: busca na API e guarda
export interface SyncResult { failures: string[]; offline: boolean }
export function onSyncState(l: (s: { pending: number; running: boolean; lastFailures: string[]; lastSentAt: number | null; message: string }) => void): () => void;
export function announce(message: string): void; // mensagem avulsa no SyncStatus (ex.: "3 baralhos levados para sua conta.")
// hooks
export function useDecks(): { decks: DeckItem[]; firstSync: boolean }; // firstSync: conta ativa, nenhuma cópia ainda e a 1ª sincronização em andamento
export function useDeck(idOrSlug: string): { deck: DeckDetail | null; loading: boolean; error: string };
// baralhos prontos (só com conta e internet)
export function listSharedDecks(): Promise<DeckResponse[]>;
export function copySharedDeck(id: string): Promise<DeckItem>; // copia na API e guarda a cópia com as fichas
```
- O "modo" é **conta** quando `getActiveAccount()` não é `null`; senão, **aparelho**.
- Escrita em baralho `kind "aparelho"` com `account` (veio de conta) marca `editedOffAccount = true`.
- `syncAccount()` só roda com conta ativa e `setOnline(true)`; uma de cada vez (promessa guardada). Depois da fila: `getDeckChanges(lastSync)`; se `RouteMissingError`, `getDecks()` e `getDeck()` em sequência para cada baralho com `updatedAt` ou `cardCount` diferente da cópia. Não sobrescreve baralho com `hasPendingFor`. Remove cópias cujo id não veio mais da API (e sem itens pendentes). `lastSync` fica em `cardvoz.conta.v1` junto da conta.
- `useDecks`/`useDeck` releem em `onLocalChange(DECKS_KEY)`. `useDeck` chama `fetchDeckFromAccount` quando não acha no aparelho.
- `AuthProvider`: em `"logado"` → `saveAccount(user)`, `setActiveAccount(user)`, `setOnline(true)`, `syncAccount()`; em `"erro"` → `setActiveAccount(getSavedAccount())`, `setOnline(false)` (**ponto 2**); em `"deslogado"` → `setActiveAccount(null)` (a conversão das cópias é da Tarefa 12). Ouve `window` `"online"` → `syncAccount()`.
- `SyncStatus` (no layout, depois do `Header`): `<p role="status">` visível só com texto. Textos da fila conforme as restrições globais; falhas aparecem uma por linha e somem na próxima sincronização sem falhas. Fica em `sr-only` sem texto.

- [ ] **Passo 1: testes que falham** (`index.test.ts`, com `vi.mock("@/lib/api")`):
  - sem conta: `createDeck({title:"Bio"})` → `kind "aparelho"`, fila vazia, `listDecks()` contém o baralho.
  - com conta: `createDeck` → `kind "conta"`, um item `criarBaralho` na fila.
  - `editCard` em baralho do aparelho que veio de conta → `editedOffAccount === true`.
  - **ponto 2:** conta salva + `setActiveAccount(getSavedAccount())` + `setOnline(false)` → `editCard` em cópia da conta enfileira e **não** chama a API.
  - `syncAccount()` com `getDeckChanges` ausente → chama `getDecks` e só busca `getDeck` do baralho cujo `updatedAt` mudou; cópia que sumiu da API é removida, a não ser que tenha item pendente.
  - `saveStudyResult` em baralho do aparelho → fila vazia; em cópia da conta → item `estudo`.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar `data/index.ts`, `SyncStatus`, ligar no `AuthProvider` e no layout. **Passo 4:** PASSA; lint e tipos ok.
- [ ] **Passo 5:** commit `feat: camada de dados entre aparelho e conta`

### Tarefa 5: Lista de baralhos sem login, cabeçalho e rotas

**Arquivos:** modificar `src/lib/routes.ts`, `src/components/Header/Header.tsx`, `src/app/baralhos/page.tsx`, `src/app/baralhos/page.module.scss`; criar `src/components/LocalNotice/{LocalNotice.tsx,LocalNotice.module.scss,index.ts}`

- `PUBLIC_PATHS` passa a incluir `routes.decks`, `routes.newDeck`, `"/baralho/"`, `"/baralho/adicionar/"`, `"/estudar/"` (comparação por `samePath`, sem query). `/perfil/` continua protegida.
- `Header`: sem login, links "Meus baralhos" e "Entrar"; com login, "Meus baralhos" e "Perfil" (como hoje).
- Lista usa `useDecks()`: skeleton só quando `firstSync`; vazio, lista e `DeckCard` como hoje (o cartão recebe `DeckItem`, sem mudança visual).
- `LocalNotice` (painel `surface`, sem foco automático, acima da lista): sem conta ativa **e** com algum baralho `kind "aparelho"` → texto da lista + link "Entrar" (`routes.loginThenReturn(routes.decks)`). Se algum desses baralhos tem `account` (veio de conta), usa o texto de sessão encerrada.
- Baralhos prontos: com conta → `listSharedDecks()`/`copySharedDeck()` (comportamento atual); sem conta → seção com o título "Baralhos prontos" e o parágrafo "Entre na sua conta para ver os baralhos prontos." com link "Entrar".
- [ ] **Passo 1:** implementar.
- [ ] **Passo 2:** verificação manual (`npm run dev`, sem login, aba anônima): criar baralho aparece na lista e continua depois de recarregar; aviso aparece; Header mostra "Meus baralhos" e "Entrar"; 375px e 320px sem rolagem horizontal; tema escuro.
- [ ] **Passo 3:** lint, tipos, `npm test`. Commit `feat: lista de baralhos sem login`

### Tarefa 6: Criar baralho, detalhe e adicionar fichas

**Arquivos:** modificar `src/app/baralhos/novo/page.tsx`, `src/app/baralho/page.tsx`, `src/app/baralho/adicionar/page.tsx`

- Trocar `@/lib/api` por `createDeck`, `useDeck`, `renameDeck`, `deleteDeck`, `addCards`, `editCard`, `deleteCard` de `@/lib/data`. As escritas são síncronas: mensagens de sucesso na hora; erro só de `StorageFullError` (via `errorMessage`).
- Importação ao criar ou adicionar: `addCards` de uma vez (a fila envia depois). Remover a barra de progresso "Importando X de Y" dessas páginas, porque salvar no aparelho é instantâneo.
- Detalhe: estados "carregando" (só enquanto `useDeck().loading`, buscando na conta), "não encontrado" e "não carregou" continuam distintos.
- Navegação depois de criar: `routes.deck(created.id)`.
- [ ] **Passo 1:** implementar. **Passo 2:** manual, sem login: criar com nome e com arquivo de `public/modelos/`, renomear, editar ficha, excluir ficha, excluir baralho, adicionar ficha por ficha ("1ª ficha salva", "2ª ficha salva"); recarregar mantém tudo. Com login: o mesmo, e as mudanças chegam na API (conferir em outro navegador logado). Com login e DevTools "Offline": editar, ver o aviso da fila, voltar online e ver "Alterações enviadas para sua conta."
- [ ] **Passo 3:** lint, tipos, testes. Commit `feat: criar e editar baralhos sem login`

### Tarefa 7: Estudo sem login e sem internet

**Arquivos:** modificar `src/app/estudar/page.tsx`

- Carrega com `useDeck`. Remove `startStudySession`, `recordStudyReview`, `finishStudySession` e a fila `enqueue` da página. Guarda `startedAt` ao começar a rodada e cada resposta (`cardId`, `wasCorrect`, `answeredAt`) num `useRef`.
- Na última resposta: `saveStudyResult(deck.id, {...})`; o placar é o calculado na tela. "Estudar de novo" zera a rodada e o `startedAt`.
- Na conclusão chama `markFirstStudyDone()` (Tarefa 15; até lá, deixar a chamada para aquela tarefa).
- Foco, travas (`ACTION_LOCK_MS`), atalhos e textos não mudam.
- [ ] **Passo 1:** implementar. **Passo 2:** manual: estudar sem login (resumo aparece, nada na fila); estudar logado offline (aviso da fila com 1 alteração) e online (histórico aparece na API: `GET /api/study-sessions/history`). Conferir com teclado: foco vai para pergunta, resposta e resumo.
- [ ] **Passo 3:** lint, tipos, testes. Commit `feat: estudar sem login e sem internet`

### Tarefa 8: Exportar e importar vários baralhos

**Arquivos:** criar `src/lib/exportDecks.ts`, `src/lib/exportDecks.test.ts`; modificar `src/lib/importCards.ts` (+ teste `src/lib/importCards.test.ts`), `src/components/FileImport/FileImport.tsx`, `src/app/baralhos/novo/page.tsx`, `src/app/baralho/page.tsx`, `src/app/baralhos/page.tsx`

**Produz:**
```ts
export interface ExportedDeck { titulo: string; fichas: { pergunta: string; resposta: string }[] }
export function toExported(d: { title: string; cards: { question: string; answer: string }[] }): ExportedDeck;
export function exportFileName(title: string | null, today: Date): string; // "cardvoz-biologia-celular.json"; null → "cardvoz-baralhos-2026-10-30.json"
export function downloadJson(fileName: string, data: unknown): void;      // Blob + <a download>
// importCards.ts
export interface ImportResult { fileName: string; title: string; cards: ImportedCard[]; skipped: number; decks?: { title: string; cards: ImportedCard[] }[] }
```
- JSON cuja raiz é uma lista em que **todo** item é objeto com uma chave de `LIST_KEYS` → `decks` preenchido (`cards` = todas as fichas, para o limite de 1000 valer no total). Lista de fichas continua como hoje.
- Detalhe do baralho: botão "Exportar baralho" (`soft`, `md`, `aria-label="Exportar baralho {título}"`) perto de "Renomear". Lista: "Exportar todos" (`soft`, `md`) no cabeçalho quando houver baralhos. Depois do download, status "Arquivo “{nome}” baixado."
- Novo baralho com `decks` (mais de um): esconde o campo de nome; botão "Importar {n} baralhos"; cria um baralho por item; status "{n} baralhos importados." e vai para a lista.
- [ ] **Passo 1: testes que falham:** `toExported` mantém ordem; `exportFileName("Biologia Celular", d)` → `"cardvoz-biologia-celular.json"` (sem acentos, minúsculas, hífen); exportar e reimportar (`parseImportText(JSON.stringify([toExported(a), toExported(b)]), "x.json")`) → `decks.length === 2` com títulos e fichas iguais; lista de fichas `[{pergunta,resposta}]` continua sem `decks`.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar. **Passo 4:** PASSA; manual: baixar e importar no celular (Chrome Android) e no computador.
- [ ] **Passo 5:** commit `feat: exportar e importar baralhos em arquivo`

### Tarefa 9: Textos (FAQ, privacidade, Ajuda)

**Arquivos:** modificar `src/app/page.tsx` (só `DUVIDAS`), `src/app/privacidade/page.tsx`, `src/components/HelpDialog/HelpDialog.tsx`

- FAQ "Preciso criar uma conta?" → "Não. Você pode criar e estudar seus baralhos sem conta, e eles ficam guardados neste aparelho. Com uma conta, seus baralhos ficam guardados também na internet e você pode usá-los em outro aparelho."
- FAQ "Meus cartões ficam salvos?" → "Sim. Ficam guardados neste aparelho e, se você entrar na sua conta, também na sua conta. Para levar para outro lugar, use Exportar."
- Privacidade: parágrafo novo dizendo que os baralhos ficam no navegador do aparelho, que sair da conta permite apagá-los dali e que limpar os dados do navegador os apaga.
- Ajuda, seção "Entrar e sair da conta": começa com "Você não precisa de conta para usar o CardVoz." e explica levar para a conta e o diálogo de sair.
- **Coordenação:** quem fizer a FAQ sem `<details>` mexe no mesmo arquivo; combinar a ordem dos PRs.
- [ ] **Passo 1:** implementar. **Passo 2:** lint, tipos. Commit `docs: textos do modo sem login`

---

## Parte 2 — Conta

### Tarefa 10: Regras de levar para a conta, repetidos e sair

**Arquivos:** criar `src/lib/data/transfer.ts`, `src/lib/data/transfer.test.ts`

**Consome:** Tarefas 2–4. **Produz:**
```ts
export function relinkUnchanged(userId: string): number;  // "aparelho" com account.userId === userId e !editedOffAccount → volta a "conta"; devolve quantos
export function uploadCandidates(userId: string): LocalDeck[]; // "aparelho" restantes (inclui os de outra conta e os editados)
export type Duplicate = { local: LocalDeck; remote: LocalDeck } | null;
export function findDuplicate(local: LocalDeck, userId: string): Duplicate; // mesma origem (account.remoteId com account.userId === userId) ou mesmo título (trim, sem diferenciar maiúsculas) entre as cópias "conta"
export type Choice = "levar" | "ficarAparelho" | "ficarConta" | "manterDois";
export function transferDeck(local: LocalDeck, choice: Choice, userId: string, api: TransferApi): Promise<void>;
export function convertCopiesToDevice(userId: string): void; // "conta" → "aparelho" com account mantido; editedOffAccount = true se tinha item na fila; limpa a fila
export function removeAccountCopies(userId: string): void;  // apaga cópias "conta" desta conta e limpa a fila
export type TransferApi = Pick<typeof import("@/lib/api"), "importDeck" | "createDeck" | "createCard" | "getDeck" | "deleteDeck">;
```
- `levar`/`manterDois` (título + " (do aparelho)"): `importDeck`; se `RouteMissingError`, `createDeck` → gravar `upload: { remoteId }` **antes** das fichas → `createCard` uma a uma. **Retomar:** se `upload` existe, `getDeck(remoteId)`; `null` → recomeça do zero; senão envia a partir de `cards.length` da API. No fim, `getDeck(remoteId)` → substitui pelo `fromApiDeck`, guardando o id antigo em `aliases`.
- `ficarAparelho`: `deleteDeck(remote.account.remoteId)`, remove a cópia, segue como `levar` com o título original.
- `ficarConta`: remove o local; a cópia da conta continua.
- [ ] **Passo 1: testes que falham:**
  - `relinkUnchanged` religa só os não editados da mesma conta.
  - `findDuplicate` acha por origem e por título "biologia " = "Biologia".
  - `levar` sem rota nova → `createDeck` e fichas na ordem; local vira `kind "conta"` com o id antigo em `aliases`.
  - **ponto 3:** `upload` já gravado e API com 2 de 5 fichas → envia só as fichas 3, 4 e 5, sem `createDeck` de novo.
  - `manterDois` → título "Biologia (do aparelho)".
  - `ficarAparelho` → `deleteDeck` com o id da conta antes de criar.
  - `convertCopiesToDevice` com item pendente → `editedOffAccount === true`, fila vazia.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar. **Passo 4:** PASSA.
- [ ] **Passo 5:** commit `feat: regras para levar baralhos para a conta`

### Tarefa 11: Diálogos de levar para a conta e de repetidos

**Arquivos:** criar `src/components/AccountTransfer/{AccountTransfer.tsx,AccountTransfer.module.scss,index.ts}`; modificar `src/app/layout.tsx`, `src/app/entrar/page.tsx`, `src/app/cadastro/page.tsx`, `src/app/baralho/page.tsx`, `src/components/index.ts`

- Entrar e cadastro, depois do login bem-sucedido (senha, cadastro e volta do Google): `sessionStorage.setItem("cardvoz.oferecerLevar", "1")`.
- `AccountTransfer` (no layout): quando `status === "logado"` e a marca existe → apaga a marca, `relinkUnchanged`, e se `uploadCandidates` não está vazio abre o diálogo "Levar para sua conta?". "Agora não" fecha. "Levar para a conta" percorre os candidatos: com `findDuplicate` → diálogo de repetidos (um por vez, com o aviso do histórico em "Ficar com o do aparelho"); sem → `transferDeck("levar")`. Progresso em `role="status"` dentro do diálogo: "Levando {i} de {n} baralhos...". Fim: fecha e anuncia no `SyncStatus` "{n} baralhos levados para sua conta." Falha de um baralho → "Não foi possível levar “{título}”. Tente de novo na página do baralho." e segue com os demais.
- Detalhe do baralho `kind "aparelho"` com conta ativa e online: botão "Levar para a conta" (`soft`, `md`), que usa o mesmo fluxo para um baralho só (exporta do componente uma função/hook `useTransferDeck`).
- Botões do diálogo com `aria-disabled` durante o envio.
- [ ] **Passo 1:** implementar. **Passo 2:** manual: sem login criar 2 baralhos, um com nome igual a um da conta; entrar → diálogo; "Levar" → repetido para o de nome igual; conferir as três opções em rodadas diferentes. "Agora não" → os baralhos ficam e o botão aparece na página do baralho. Teclado: foco preso no diálogo; Esc fecha.
- [ ] **Passo 3:** lint, tipos, testes. Commit `feat: levar baralhos do aparelho para a conta`

### Tarefa 12: Sair da conta e fim de sessão

**Arquivos:** criar `src/components/LogoutDialog/{LogoutDialog.tsx,index.ts}`; modificar `src/components/Header/Header.tsx`, `src/app/perfil/page.tsx`, `src/components/AuthProvider/AuthProvider.tsx`, `src/components/index.ts`

- `LogoutDialog({ open, onClose })`: texto e botões das restrições globais. Com `pendingCount > 0`, acrescenta "{n} alterações ainda não foram enviadas para sua conta. Se você apagar, elas se perdem." "Manter" → `convertCopiesToDevice(userId)`; "Apagar" → `removeAccountCopies(userId)`; nos dois, `clearSavedAccount()`, `logout()` e `router.replace(routes.decks)`. Cancelar com Esc ou "Cancelar".
- Header e Perfil abrem o diálogo em vez de chamar `logout()` direto.
- `AuthProvider`: fim de sessão com `reason "expired"` → `convertCopiesToDevice(contaAnterior)`, `clearSavedAccount()`, `setActiveAccount(null)`. Não chama mais `setNotice` para "expired" (o aviso da lista cobre isso).
- [ ] **Passo 1:** implementar. **Passo 2:** manual: sair com "Manter" → baralhos continuam, editáveis sem login, aviso de sessão encerrada na lista; entrar de novo → os não editados voltam sozinhos, o editado cai no diálogo de repetidos. Sair com "Apagar" → só os do aparelho ficam. Simular fim de sessão: apagar `cardvoz.refreshToken` no DevTools e recarregar com a API respondendo 401 → baralhos mantidos.
- [ ] **Passo 3:** lint, tipos, testes. Commit `feat: sair da conta mantendo ou apagando os baralhos`

---

## Parte 3 — Abrir sem internet e instalar

### Tarefa 13: Manifest e ícones

**Arquivos:** criar `public/manifest.webmanifest`, `public/icones/icone-192.png`, `public/icones/icone-512.png`, `public/icones/icone-maskable-512.png`, `public/icones/apple-touch-icon.png` (180); modificar `src/app/layout.tsx`

- Gerar os PNG uma vez a partir de `docs/logo/cardvoz-app.svg` com `node -e` usando `sharp` (já em `node_modules`); a versão maskable com fundo `#2846C4` e o ícone em 80% do tamanho. Não criar script permanente.
- Manifest: `name "CardVoz"`, `short_name "CardVoz"`, `start_url "/baralhos/"`, `scope "/"`, `display "standalone"`, `lang "pt-BR"`, `background_color` e `theme_color` iguais a `--bg` e `--primary` do tema claro (copiar de `globals.scss`).
- Layout: `metadata.manifest = "/manifest.webmanifest"`, `metadata.appleWebApp = { capable: true, title: "CardVoz" }`, `icons.apple`, e `export const viewport = { themeColor }`.
- [ ] **Passo 1:** implementar. **Passo 2:** `npm run build && npx serve out`; Chrome DevTools > Application > Manifest sem erros. **Passo 3:** commit `feat: manifest e ícones do app`

### Tarefa 14: Service worker

**Arquivos:** criar `scripts/gerar-sw.mjs`, `scripts/sw-modelo.js`, `scripts/gerar-sw.test.ts`, `src/components/ServiceWorkerRegister/{ServiceWorkerRegister.tsx,index.ts}`; modificar `package.json` (`"build": "next build && node scripts/gerar-sw.mjs"`), `src/app/layout.tsx`, `vitest.config.ts` (incluir `scripts/**/*.test.ts`)

**Produz** (`gerar-sw.mjs`):
```ts
export function listPrecache(outDir: string): string[]; // "/" + caminhos de out/, sem sw.js, sem .map, sem *.txt, sem public/assets (imagens de apresentação)
export function buildServiceWorker(template: string, files: string[]): string; // troca __VERSAO__ (hash sha256 curto da lista + conteúdo) e __ARQUIVOS__ (JSON)
```
**`sw-modelo.js`** (comportamento):
- `install`: abre o cache `cardvoz-__VERSAO__`, `addAll` dos arquivos, `skipWaiting()`.
- `activate`: apaga caches `cardvoz-*` de outras versões, `clients.claim()`.
- `fetch`: só `GET` da **mesma origem** (a API é outra origem e nunca entra no cache). `/_next/static/` → cache primeiro. Navegação (`request.mode === "navigate"`) → rede primeiro; sem rede, `caches.match(request, { ignoreSearch: true })` (para `/baralho/?id=…` achar `/baralho/index.html`), senão `/baralhos/index.html`. Demais → cache, depois rede.
- `ServiceWorkerRegister` (no layout): em produção e com `"serviceWorker" in navigator`, registra `/sw.js` depois do `load`. Também ouve `beforeinstallprompt` (Tarefa 15 usa).
- [ ] **Passo 1: testes que falham:** `listPrecache` numa pasta temporária com `index.html`, `baralho/index.html`, `_next/static/a.js`, `sw.js`, `x.map` → devolve `/`, `/baralho/`, `/_next/static/a.js`; `buildServiceWorker` troca os dois marcadores e muda a versão quando a lista muda.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar. **Passo 4:** PASSA.
- [ ] **Passo 5:** manual: `npm run build && npx serve out`; abrir, navegar na lista, DevTools "Offline", recarregar `/baralhos/` e `/baralho/?id=<id>` → abrem; estudar funciona. Publicar mudança (novo build) e recarregar online → versão nova.
- [ ] **Passo 6:** commit `feat: abrir o CardVoz sem internet`

### Tarefa 15: Cartão "Instalar o CardVoz" e Ajuda

**Arquivos:** criar `src/lib/install.ts`, `src/lib/install.test.ts`, `src/components/InstallCard/{InstallCard.tsx,InstallCard.module.scss,index.ts}`; modificar `src/app/baralhos/page.tsx`, `src/app/estudar/page.tsx`, `src/components/ServiceWorkerRegister/ServiceWorkerRegister.tsx`, `src/components/HelpDialog/HelpDialog.tsx`, `src/components/index.ts`

**Produz:**
```ts
export const INSTALL_KEY = "cardvoz.instalar.v1";          // { hiddenUntil?: number; never?: boolean }
export const FIRST_STUDY_KEY = "cardvoz.primeiroEstudo.v1"; // true
export const SNOOZE_DAYS = 7;
export function markFirstStudyDone(): void;
export function snoozeInstall(now: number): void;          // hiddenUntil = now + 7 dias
export function neverShowInstall(): void;
export function shouldShowInstallCard(env: { now: number; standalone: boolean; platform: "android" | "ios" | "outro"; hasPrompt: boolean }): boolean;
export function setInstallPrompt(e: BeforeInstallPromptEvent | null): void;
export function useInstallPrompt(): { prompt: (() => Promise<void>) | null; platform: "android" | "ios" | "outro"; standalone: boolean };
```
- Mostra quando: primeiro estudo concluído, não `standalone` (`matchMedia("(display-mode: standalone)")` ou `navigator.standalone`), não `never`, `now >= hiddenUntil`, e (`android` com `hasPrompt`) ou `ios`. `outro` (computador) não mostra.
- `InstallCard`: painel `surface` na lista, depois do `LocalNotice`, sem foco automático. Título `h2` "Instalar o CardVoz"; texto "Abra o CardVoz direto da tela inicial, como um aplicativo." Android: botão "Instalar o CardVoz" chama `prompt`. iPhone: o passo a passo. Botões "Agora não" e "Não mostrar mais" (`ghost`, `md`). Ao fechar, foco vai para o `h1` da página.
- Estudo: `markFirstStudyDone()` ao concluir.
- Ajuda: seção nova `<details>` "Instalar no celular" (`SectionId` ganha `"instalar"`) com Android (menu do Chrome → "Instalar app" ou "Adicionar à tela inicial") e iPhone (Compartilhar → "Adicionar à Tela de Início").
- [ ] **Passo 1: testes que falham:** não mostra antes do primeiro estudo; mostra no android com prompt; não mostra em `standalone`; `snoozeInstall(t)` esconde até `t + 7 dias` e mostra em `t + 7 dias`; `neverShowInstall` esconde sempre; `outro` nunca.
- [ ] **Passo 2:** FALHA. **Passo 3:** implementar. **Passo 4:** PASSA; manual no Chrome Android (via `npx serve out` na rede local ou no deploy de teste) e no Safari iOS se houver aparelho.
- [ ] **Passo 5:** commit `feat: sugerir instalar o CardVoz na tela inicial`

---

## Documentação e entrega

### Tarefa 16: README, AGENTS.md e tarefa da parte 4 na API

**Arquivos:**
- `cardvoz`: modificar `README.md` (modo sem login, `npm test`, service worker no build, como testar offline), `AGENTS.md` (seção 2: conta opcional; 4: novas pastas; 5: `PUBLIC_PATHS`; 6: páginas usam `@/lib/data`, fila, chaves do `localStorage`; 7: diálogos de levar/sair, aviso da lista; 10: componentes novos; 14: `npm test`; 15: pontos de atenção do armazenamento local).
- `cardvoz-api` (branch nova `docs/parte-4-menos-chamadas` a partir da `main`): criar `docs/tarefas/parte-4-menos-chamadas.md` com contexto, as três rotas (comportamento da spec, corpo e resposta sugeridos, validações, sem migration), como o site detecta a rota ausente (404/405) e ordem de publicação; linkar no `README.md` da API. Commit `docs: descrever a tarefa de rotas com menos chamadas`. **Não fazer push** sem a pessoa pedir.
- `cardvoz-db`: nada muda.
- [ ] **Passo 1:** escrever. **Passo 2:** commits (`docs: atualizar guias com o modo sem login` no cardvoz).

### Tarefa 17: Verificação final

- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` sem erros.
- [ ] Checklist manual do AGENTS.md: 375px e 320px sem rolagem horizontal, tema escuro, teclado, nenhum texto < 16px, em todas as telas mudadas.
- [ ] Fluxo completo no Chrome Android com TalkBack (se houver aparelho): sem login criar, importar, estudar; instalar; offline; entrar e levar; sair mantendo.
- [ ] Não fazer push na `main` (publica em produção). Abrir PR a partir da branch quando a pessoa pedir.
