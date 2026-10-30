# Modo sem login: baralhos no aparelho

Data: 2026-10-30 · Situação: aprovado no chat pelo grupo

## Por quê

A cliente é cega e usa o TalkBack no celular. Digitar e-mail e senha com o TalkBack é trabalhoso, e hoje o CardVoz não deixa criar nem estudar nada sem entrar na conta. O pedido dela: usar o app sem conta, com os baralhos guardados no próprio aparelho, exportar e importar em arquivo sem login e, se quiser, levar os baralhos para a conta depois.

O CardVoz é usado principalmente no **celular e no tablet, aparelhos pessoais**, e guarda só perguntas de estudo, não dados pessoais. Por isso as decisões abaixo favorecem a liberdade de quem usa, e não a proteção contra quem pega o aparelho emprestado.

## Objetivos

1. Criar, importar, editar e estudar baralhos **sem login**, com tudo salvo no aparelho.
2. A conta vira opcional: um jeito de guardar os baralhos e usá-los em outro aparelho.
3. **Todos os baralhos aparecem numa lista só**, os do aparelho e os da conta, logada ou não.
4. Os baralhos da conta ficam também guardados no aparelho: abrem rápido e dá para **estudar e editar sem internet**.
5. O site **abre sem internet** (service worker) e pode ser **instalado na tela inicial**.
6. Exportar baralhos em arquivo e importar de novo, sem login.

## Fora do escopo (etapas futuras, se a cliente pedir)

- Sincronização completa entre aparelhos com detecção de conflito por ficha.
- Comparar duas versões de um baralho ficha por ficha.
- **Qualquer mudança no `cardvoz-db`.** A `cardvoz-api` ganha só as rotas da parte 4, sem mudar tabelas.

## O que não pode acontecer (seria fracasso mesmo funcionando)

- A pessoa perder fichas sem ter escolhido isso.
- Uma tela, diálogo ou aviso abrir sozinho e roubar o foco do TalkBack fora dos momentos combinados abaixo.
- Tratar falha como sucesso: se algo não foi para a conta, a tela diz.
- Duas renovações de sessão em paralelo (a API encerra todas as sessões da pessoa). Continua valendo `refreshSession()` como única porta.

## Regras combinadas

### Tipos de baralho

| Tipo | Onde está a versão certa | Editar sem login | Editar sem internet |
|---|---|---|---|
| **Do aparelho** | no aparelho | sim | sim |
| **Da conta** (cópia guardada) | na API | só logado na conta dona | sim, as alterações entram na fila |

Cada baralho guardado registra de onde veio: do aparelho, ou da conta X (id da pessoa + id do baralho na API).

### Sem login

- "Começar a estudar" e "Começar agora" levam direto a "Meus baralhos". Nenhuma tela pede login.
- As rotas `/baralhos/`, `/baralhos/novo/`, `/baralho/`, `/baralho/adicionar/` e `/estudar/` passam para `PUBLIC_PATHS`. `/perfil/` continua protegida.
- A lista mostra um aviso fixo, sem foco automático, quando houver baralhos só do aparelho e a pessoa não estiver logada: "Seus baralhos estão só neste aparelho. Entre na sua conta para guardá-los." com o link "Entrar".

### Edição sem internet (fila de alterações)

- Sem internet, editar um baralho da conta funciona na mesma tela de sempre: a mudança aparece na hora e vai para uma **fila guardada no aparelho**, ligada à conta.
- Aviso em `role="status"`: "Sem internet. 2 alterações serão enviadas quando você se conectar." Ao enviar: "Alterações enviadas para sua conta."
- A fila é enviada em ordem, com as rotas existentes, quando a conexão volta e a pessoa está logada na conta dona.
- Se uma alteração não puder ser aplicada (por exemplo, a ficha foi excluída em outro aparelho), o aviso diz qual ficha e a fila segue com as demais.
- **Vale a última alteração enviada.** Edição simultânea em dois aparelhos não é detectada (aceito pelo grupo).
- Estudo de baralho da conta sem internet: o resultado entra na mesma fila e vai para o histórico depois.

### Entrar na conta com baralhos no aparelho

Logo depois de entrar, se existirem baralhos que não estão na conta, abre **um diálogo** (componente `Dialog`):
"Você tem 3 baralhos neste aparelho. Levar para sua conta?", com **"Levar para a conta"** e **"Agora não"**.

- "Agora não": os baralhos continuam na lista como baralhos do aparelho. Cada um tem a ação "Levar para a conta" para depois.
- Baralhos que vieram **desta mesma conta** e **não foram editados** depois de sair não entram no diálogo: voltam a ser da conta, sem pergunta.
- Baralhos que vieram desta conta e **foram editados** depois de sair, ou baralhos do aparelho com **o mesmo nome** de um baralho da conta, caem no **diálogo de repetidos**, um baralho por vez:
  "Já existe "Biologia" na sua conta." com **"Ficar com o do aparelho"**, **"Ficar com o da conta"** e **"Manter os dois"**.
  - "Ficar com o do aparelho" substitui o da conta. O diálogo avisa numa frase que o histórico de estudo daquele baralho na conta será apagado.
  - "Ficar com o da conta" descarta a versão do aparelho.
  - "Manter os dois" leva o do aparelho como um baralho novo.
- Levar para a conta usa `createDeck` + `createCards`. O progresso é anunciado em `role="status"`, e um envio interrompido continua de onde parou, sem duplicar fichas nem baralhos.

### Sair da conta

"Sair da conta" (no Perfil e no menu) abre um diálogo:
"Os baralhos da sua conta estão guardados neste aparelho. Quem usar este aparelho poderá vê-los.", com **"Manter neste aparelho"** e **"Apagar deste aparelho"**.

- **Manter:** os baralhos da conta viram baralhos do aparelho, livres para estudar e editar sem login. Lembram de qual conta vieram (para a regra de "entrar de novo" acima). Alterações da fila já estão aplicadas no aparelho e não se perdem.
- **Apagar:** remove do aparelho as cópias dos baralhos da conta e a fila daquela conta. Baralhos só do aparelho ficam. Se houver alterações na fila, o diálogo avisa que elas não foram enviadas.
- Os baralhos continuam na conta nos dois casos.

**Sessão que termina sem "Sair da conta"** (30 dias sem abrir, saída em outro aparelho, renovação recusada): vale como **"Manter"**, sem perguntar. A lista mostra, sem roubar o foco: "Sua sessão terminou. Seus baralhos continuam neste aparelho. Entre de novo para guardá-los na conta." Ao entrar de novo na mesma conta, vale a regra de "entrar de novo" acima.

### Exportar e importar

- Exportar um baralho (no detalhe do baralho) e "Exportar todos" (na lista), sem login.
- Formato: o mesmo JSON que a importação já lê (`{ "titulo": "...", "fichas": [...] }`). "Exportar todos" usa uma lista desses objetos, e a importação passa a aceitar esse formato (um baralho por item).
- Importar funciona sem login e salva no aparelho (logado e com internet, salva na conta, como hoje).

### Abrir sem internet e instalar na tela inicial

- **Service worker** guarda as páginas e os arquivos do site na primeira visita e os entrega offline. As chamadas à API **nunca** entram nesse cache.
- Uma versão nova publicada substitui a guardada sem deixar a pessoa presa na antiga.
- `manifest` do app (nome, ícones da marca em `docs/logo/`, cores dos temas) para permitir a instalação.
- **Cartão "Instalar o CardVoz"** na lista de baralhos:
  - não abre sozinho como diálogo nem rouba o foco;
  - aparece depois que a pessoa termina o primeiro estudo;
  - não aparece se o site já foi aberto pelo ícone instalado;
  - Android: o botão abre a janela nativa de instalação do navegador;
  - iPhone/iPad: mostra o passo a passo ("Toque em Compartilhar e depois em Adicionar à Tela de Início");
  - **"Agora não"** esconde por **7 dias**; **"Não mostrar mais"** esconde de vez.
- A **Ajuda** ganha a seção "Instalar no celular" com as mesmas instruções.

### Textos que mudam

- FAQ "Preciso criar uma conta?": não precisa; a conta serve para guardar os baralhos e usá-los em outro aparelho.
- FAQ "Meus cartões ficam salvos?": no aparelho, e na conta se você entrar.
- Política de privacidade: os baralhos ficam guardados no navegador do aparelho.
- Ajuda: o que muda com e sem conta.

### Menos chamadas à API (parte 4, na `cardvoz-api`)

Hoje o site faz várias chamadas onde uma bastaria. Três rotas novas resolvem isso, todas com login (`[Authorize]`), só com os dados da própria pessoa e **sem migration**:

1. **Baralho com todas as fichas numa chamada** (ex.: `POST /api/decks/import`): recebe título, categoria, descrição e a lista de fichas (pergunta e resposta, na ordem); cria tudo numa transação, ou nada se algo falhar, e devolve o baralho com as fichas. Também uma rota para acrescentar várias fichas a um baralho que já existe (ex.: `POST /api/decks/{id}/cards/batch`), usada em "Adicionar fichas" ao importar arquivo. Mesmas validações de `CreateCardDto` e limite de 1000 fichas por chamada, como a importação do site.
   *Hoje:* `createCards` faz uma chamada por ficha (1000 fichas, 1000 chamadas).
2. **Sessão de estudo inteira numa chamada** (ex.: `POST /api/study-sessions/complete`): recebe o baralho, início, fim e a lista de respostas (ficha, acertou, horário); cria a sessão já concluída. Fichas que não existem mais no baralho são ignoradas (podem ter sido excluídas enquanto a pessoa estudava sem internet). Horários no futuro são trazidos para o horário do servidor.
   *Hoje:* cada resposta faz duas chamadas.
3. **Baralhos alterados desde uma data** (ex.: `GET /api/decks/changes?since=<data>`): devolve, numa chamada, os baralhos da pessoa criados ou alterados depois da data, já com as fichas, a lista de ids de **todos** os baralhos atuais (para o site saber quais foram excluídos, já que exclusões não deixam rastro no banco) e o horário do servidor, para usar como `since` na próxima vez. Sem `since`, devolve todos.
   *Hoje:* a lista e mais uma chamada por baralho alterado.

**Correção só no site (parte 1):** `recordStudyReview` pede a sessão inteira depois de cada resposta e ninguém usa o retorno. Tirar essa segunda chamada.

**Convivência:** o site das partes 1 e 2 funciona com as rotas atuais e passa a usar as novas quando existirem. Se a rota nova responder 404 ou 405 (API ainda sem ela), o site usa o caminho antigo. Ordem de publicação: API antes do site que depende dela.

## Restrições do projeto (valem como sempre)

AGENTS.md inteiro, em especial: site estático; nada de áudio próprio; toque ≥ 48px e texto ≥ 16px; contraste ≥ 7:1 nos dois temas; `Dialog` nativo para diálogos; mensagens em `role="status"` que mudam de texto para serem anunciadas de novo; tokens nunca em URL nem em `console.log`.

## Divisão sugerida em quatro partes

1. **Dados no aparelho e páginas sem login:** camada de dados que escolhe entre aparelho e API, cópia dos baralhos da conta, fila de alterações offline, `PUBLIC_PATHS`, aviso na lista, exportar e importar, e a correção do `recordStudyReview`.
2. **Conta:** diálogo de levar para a conta, diálogo de repetidos, diálogo de sair, fim de sessão como "Manter", regra de "entrar de novo".
3. **Offline e instalação:** service worker, manifest, cartão "Instalar o CardVoz" e seção na Ajuda.
4. **API com menos chamadas:** as três rotas novas na `cardvoz-api`.

A parte 2 depende da 1. As partes 3 e 4 podem começar em paralelo com a 1.

## Decisões tomadas pelo Claude (o grupo pode mudar)

- **Armazenamento:** `localStorage`, com chaves versionadas (ex.: `cardvoz.decks.v1`, `cardvoz.fila.v1`). Ao encher, a tela avisa e sugere exportar. Pedir `navigator.storage.persist()` para o navegador não apagar os dados sozinho.
- **IDs locais:** `crypto.randomUUID()`. Baralho do aparelho usa o próprio id como slug nas rotas.
- **Atualizar as cópias da conta:** ao abrir a lista com internet, `getDecks()`; para cada baralho cujo `updatedAt` ou `cardCount` mudou, `getDeck()` em sequência, em segundo plano. A API já atualiza o `UpdatedAt` do baralho ao criar, editar ou excluir fichas.
- **Baralho criado logado, sem internet:** entra na fila como criação; o id local é trocado pelo da API quando a fila é enviada.
- **Estudo de baralho só do aparelho:** mostra o resumo no fim, sem guardar histórico.
- **"Manter os dois" no diálogo de repetidos:** o baralho do aparelho vai para a conta com o nome "Biologia (do aparelho)", para não haver dois nomes iguais lidos pelo TalkBack.
- **Baralhos prontos (compartilhados):** a rota da API exige login. Sem login, a seção mostra "Entre na sua conta para ver os baralhos prontos." em vez da lista.
- **Várias abas:** a fila é enviada por uma aba de cada vez (`navigator.locks`, como a renovação da sessão), e as outras abas atualizam a lista pelo evento `storage`.
- **Retomar um envio interrompido:** as fichas vão uma por vez, na ordem. Ao retomar, `getDeck()` do baralho na conta e continuar a partir da quantidade de fichas que ele já tem (uma ficha que chegou mas cuja resposta se perdeu já entra nessa contagem). Guardar no aparelho o id do baralho na API assim que ele for criado.
- **Ordem de envio ao levar para a conta:** com a rota de importação da parte 4, uma chamada por baralho; sem ela, sequencial, como o `createCards` atual.
- **Detalhes das rotas da parte 4:** nomes, formato exato dos DTOs e respostas de erro seguem o padrão dos controllers atuais (`ApiError` com `fieldErrors`). O que está acima é o comportamento.

## Deixado para quem implementa

Estrutura de arquivos e nomes da camada de dados, formato interno do que fica guardado, estratégia de cache do service worker (desde que cumpra as regras acima), layout dos cartões, avisos e diálogos dentro do estilo visual do AGENTS.md.
