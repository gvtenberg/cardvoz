# Tarefa: editar e excluir baralhos e fichas

**Responsável:** Élida
**Repositório:** CardVoz (frontend)
**Depende de:** Passos 1 a 3 da tarefa do Gutemberg ([`gutemberg-login-cadastro.md`](./gutemberg-login-cadastro.md)): IDs como texto, fim dos dados de exemplo e `fetchApi` enviando o token e lançando `ApiError`. Combine com o Gutemberg. Enquanto isso não entra, você já pode montar a parte visual (diálogos e botões).

Antes de começar, leia o [`AGENTS.md`](../../AGENTS.md) da raiz: regras de acessibilidade, estilo, componentes (`Dialog`, `Button`, `Input`, `Textarea`) e composição de páginas.

---

## 1. Contexto

Hoje dá para criar baralhos e fichas, mas não dá para **corrigir um erro de digitação** nem **apagar uma ficha**. Só existe a exclusão do baralho inteiro. A API já tem as rotas e só deixa a dona do baralho editar ou excluir. Falta a interface.

Lembre-se de quem usa o CardVoz: pessoas cegas ou com baixa visão, com **TalkBack** (Android) ou **NVDA** (Windows). Editar e excluir mexe com o **foco**. Quando um item some da tela, o leitor de tela precisa saber para onde ir. Esse é o ponto mais delicado desta tarefa.

## 2. Escopo

**Entra:**
- **Renomear baralho**, na página do baralho (`/baralho/?id=...`).
- **Excluir baralho**: já existe; revisar com o token, o ID em texto e o tratamento de erros.
- **Editar ficha** (pergunta e resposta).
- **Excluir ficha.**

**Não entra** (pode virar tarefa futura):
- Editar categoria e descrição. A criação de baralho também só pede o nome, para manter a tela simples; se a equipe quiser, a API já aceita esses campos.
- Reordenar fichas (a API aceita `displayOrder`, mas isso pede um design acessível próprio).
- Desfazer exclusão: a API apaga de verdade, não existe lixeira.

---

## 3. Contrato da API

Respostas reais da API, conferidas em teste. Todas exigem login (o `fetchApi` do Gutemberg cuida do token e do `401`).

| Ação | Rota | Corpo | Sucesso |
|---|---|---|---|
| Renomear baralho | `PUT /api/decks/{id}` | `{ "title": "Novo nome" }` | `200` + baralho atualizado |
| Excluir baralho | `DELETE /api/decks/{id}` | — | `204` (apaga fichas e sessões junto) |
| Editar ficha | `PUT /api/cards/{id}` | `{ "question": "...", "answer": "..." }` | `200` + ficha atualizada |
| Excluir ficha | `DELETE /api/cards/{id}` | — | `204` |

Exemplo de `PUT /api/decks/{id}`:

```json
{ "id": "f37a52e2-1fff-41fe-b8f7-dfb94d4f3ad8", "slug": "biologia-celular", "title": "Biologia Celular II",
  "category": "Geral", "cardCount": 1, "createdAt": "2026-10-13T01:31:03Z", "updatedAt": "2026-10-13T01:31:03Z" }
```

**Comportamentos importantes:**

1. **A edição é parcial: campo vazio é ignorado.** Se você mandar `{ "title": "" }`, a API responde `200` e **mantém o nome antigo**, sem erro. Por isso o frontend **precisa** validar antes de enviar. Sem essa validação, a pessoa apaga o nome, toca em salvar, ouve "salvo" e nada muda.
2. **O endereço do baralho não muda ao renomear.** O `slug` (ex.: `biologia-celular`) continua o mesmo. Não envie `slug`: assim links salvos e o botão "voltar" continuam funcionando.
3. **Limites:** nome do baralho até **200** caracteres; pergunta e resposta até **5000** cada.
4. **Erros:**
   - `400`: `{ "errors": { "Title": ["O título não pode ter mais de 200 caracteres."] } }` (as chaves são `Title`, `Question` e `Answer`).
   - `404`: `{ "message": "Cartão com ID ... não foi encontrado." }`. Acontece quando o item já foi excluído (ex.: em outra aba) ou não é seu.
5. Todos os IDs são **texto** (UUID), ex.: `"48bc5ab4-ca20-4aaf-b77c-bb48698d284e"`.

No `src/lib/api.ts` já existem `updateDeck`, `deleteDeck`, `updateCard` e `deleteCard`. Depois do Passo 1 do Gutemberg, elas recebem `id: string` e **lançam erro** em vez de fingir sucesso localmente. Mantenha assim: nunca trate falha como sucesso.

---

## 4. Onde ficam os botões

### Página do baralho (`src/app/baralho/page.tsx`)

**Topo:** continua só com **Estudar** e **Adicionar fichas**. Estudar é o que a pessoa mais faz; o topo não deve competir com ações de manutenção.

**Fim da página**, onde hoje fica "Excluir baralho": vira uma área **"Gerenciar baralho"** (com um `h2`), com dois botões:
- **Renomear baralho** (variante `secondary`)
- **Excluir baralho** (variante `danger`, que já existe)

**Por quê:** ações destrutivas e de manutenção ficam longe das ações do dia a dia. Isso evita toques acidentais, principalmente para quem explora a tela pelo toque com TalkBack.

**Cada ficha da lista** ganha uma linha de ações abaixo da pergunta e da resposta:
- **Editar** (variante `soft`, tamanho `sm` = 48px de altura)
- **Excluir** (variante `danger`, tamanho `sm`)

Os dois botões precisam de `aria-label` com o número da ficha: `aria-label="Editar ficha 3"` e `aria-label="Excluir ficha 3"`.

**Por quê:** sem o número, quem navega pelos botões ouve "Editar, Editar, Editar…" sem saber de qual ficha. Use o número, e não o texto da pergunta: perguntas longas deixariam o rótulo enorme. O rótulo também precisa **conter o texto visível** ("Editar"), regra WCAG 2.5.3, para quem usa comando de voz conseguir acionar.

---

## 5. Os fluxos

Use o componente `Dialog` (já existe e é usado na exclusão do baralho). Ele usa o `<dialog>` nativo, que prende o foco dentro dele, fecha com `Esc` e é anunciado corretamente pelos leitores de tela. **Não crie** modais com `div`.

Para um formulário dentro do `Dialog`, coloque o `<form id="...">` no conteúdo e o botão de salvar no `footer` com `form="..."` e `type="submit"`:

```tsx
<Dialog
  open={editando}
  onClose={fechar}
  title="Renomear baralho"
  footer={
    <>
      <Button variant="secondary" onClick={fechar} disabled={salvando}>Cancelar</Button>
      <Button type="submit" form="form-renomear" disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar"}
      </Button>
    </>
  }
>
  <form id="form-renomear" onSubmit={salvar} noValidate>
    {/* Sem maxLength: ele corta em silêncio o texto colado. Valide e mostre a mensagem. */}
    <Input label="Nome do baralho" required value={nome} error={erro}
           onChange={(e) => setNome(e.target.value)} />
  </form>
</Dialog>
```

### 5.1 Renomear baralho

1. "Renomear baralho" abre o diálogo com o campo **já preenchido** com o nome atual.
2. Ao salvar, valide: o nome não pode estar vazio (só espaços conta como vazio) nem passar de 200 caracteres. Erros vão na prop `error` do `Input`, com o foco no campo.
3. Envie `updateDeck(deck.id, { title: nome.trim() })`. Se nada mudou, só feche o diálogo, sem chamar a API.
4. **Sucesso:** feche o diálogo, atualize o `h1` da página e anuncie **"Nome do baralho atualizado."** num `role="status"`. O foco deve voltar ao botão "Renomear baralho".
5. **Erro:** o diálogo continua aberto com o texto digitado e uma mensagem num `role="alert"`. **Por quê:** fechar e perder o que foi digitado obriga a pessoa a digitar tudo de novo, o que é especialmente custoso com leitor de tela.

### 5.2 Editar ficha

1. "Editar ficha 3" abre o diálogo **"Editar ficha 3"**, com dois `Textarea` ("Pergunta" e "Resposta") já preenchidos.
2. Valide: nenhum dos dois vazio, cada um com até 5000 caracteres. Envie só o que mudou, ou os dois (a API aceita).
3. **Sucesso:** feche o diálogo, atualize a ficha na lista e anuncie **"Ficha 3 atualizada."**. O foco volta ao botão "Editar ficha 3".
4. **Erro:** igual ao 5.1. Se for **404**, a ficha não existe mais: feche o diálogo, recarregue o baralho e anuncie "Esta ficha não existe mais."

### 5.3 Excluir ficha

1. "Excluir ficha 3" abre um diálogo de confirmação:
   - Título: **"Excluir a ficha 3?"**
   - Texto: a pergunta da ficha (para a pessoa ter certeza de qual é) e "Não dá para desfazer."
   - Botões: **Cancelar** e **Sim, excluir** (variante `danger`).
2. **Sucesso:** remova a ficha da lista e anuncie **"Ficha excluída."**.
3. **Foco depois de excluir (ponto crítico):** o botão que abriu o diálogo **deixou de existir**. Se você não fizer nada, o foco vai parar no topo da página (ou em lugar nenhum) e quem usa leitor de tela fica perdido. Mova o foco assim:
   - para o botão **"Editar"** da ficha que veio depois, ou
   - da ficha anterior, se a excluída era a última, ou
   - para o título **"Fichas"** (com `tabIndex={-1}`), se a lista ficou vazia.

   Use `ref`s nos botões ou procure pelo `id` do elemento depois que o React atualizar a lista (um `useEffect` que roda quando a lista muda funciona bem).
4. Atualize a contagem "N fichas" do topo.

### 5.4 Excluir baralho (revisar o que já existe)

O fluxo atual está em `handleDelete` na página do baralho. Ajuste:

1. `deleteDeck(deck.id)` com o ID em texto. Erro (exceto 404) mantém o diálogo aberto com a mensagem.
2. **Sucesso:** vá para a lista de baralhos (`routes.decks`) e anuncie lá **"Baralho excluído."**. Como a página muda, passe a mensagem por `sessionStorage` (ex.: chave `cardvoz.aviso`) e mostre/limpe na lista de baralhos num `role="status"`. **Por quê:** hoje a mensagem aparece por 600ms antes de trocar de página, e o leitor de tela geralmente não tem tempo de ler.
3. **404:** o baralho já foi excluído (ex.: em outra aba). Trate como sucesso: vá para a lista de baralhos.

---

## 6. Regras gerais (e por quê)

- **Espere a resposta da API antes de mudar a tela** (sem "atualização otimista"). Para quem não enxerga a tela, um "ficha excluída" anunciado e depois desfeito por erro é muito confuso. O feedback precisa ser **verdadeiro**.
- **Botões desabilitados enquanto salva/exclui**, com o texto mudando para "Salvando..."/"Excluindo...". Isso evita envio duplo por toque duplo.
- **Mensagens de status com texto diferente a cada vez**, para o leitor de tela anunciar de novo (ex.: "Ficha 3 atualizada.", "Ficha 5 atualizada.").
- **Foco sempre previsível:** ao abrir um diálogo, o foco entra nele; ao fechar, volta para o botão que o abriu (ou para o vizinho, se o botão sumiu). O `<dialog>` nativo normalmente devolve o foco sozinho ao fechar; **confira no NVDA e no TalkBack** e, se não devolver, faça manualmente com `ref.current.focus()`.
- **Visual:** use só os tokens e componentes existentes. Nada de texto abaixo de 16px, botões com pelo menos 48px de altura, e tudo funcionando no tema escuro. Excluir usa a variante `danger` (vermelho suave, sem alarme).
- **Textos:** "Renomear baralho", "Editar", "Excluir", "Sim, excluir", "Cancelar", "Salvar". Mensagens de erro dizem o que fazer ("Escreva um nome para o baralho.").

## 7. Como testar localmente

1. Rode a `cardvoz-api` localmente (README dela) e o frontend com `npm run dev`.
2. Com o login do Gutemberg pronto, crie uma conta pela tela de cadastro. Antes disso, dá para criar conta e testar as rotas pelo Swagger (`http://localhost:5000/swagger`): use `POST /api/auth/register` e cole o `accessToken` no botão **Authorize**.

## 8. Checklist antes do PR

- [ ] Renomear: sucesso; nome vazio (erro no campo, nada enviado); nome com 201 caracteres; sem mudança (só fecha).
- [ ] Editar ficha: sucesso; pergunta ou resposta vazia; texto longo; 404 (exclua a ficha em outra aba e tente editar na primeira).
- [ ] Excluir ficha: do meio, a última e a única da lista. **Confira para onde o foco vai em cada caso.**
- [ ] Excluir baralho: sucesso com aviso na lista de baralhos; 404 tratado.
- [ ] API fora do ar: mensagem de erro clara, nada some da tela.
- [ ] Teclado: tudo alcançável com `Tab`; `Esc` fecha os diálogos; `Enter` no campo do nome salva.
- [ ] **TalkBack e NVDA:** rótulos "Editar ficha 3" lidos corretamente; anúncios de sucesso e erro; foco depois de excluir.
- [ ] **375px**, **zoom de 200%** e **tema escuro**.
- [ ] `npm run lint`, `npx tsc --noEmit` e `npm run build` passando.

## 9. Entrega

- Branch próprio (ex.: `feat/editar-excluir-fichas`), a partir da `main` já com os Passos 1 a 3 do Gutemberg.
- Commits no padrão do projeto (Conventional Commits em português, ex.: `feat: permitir editar fichas`), **sem menções a IA**.
- **Push na `main` publica o site**: só junte depois de revisado e com os testes passando.
