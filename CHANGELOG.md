# Histórico de versões do CardVoz

A versão aparece no rodapé da página inicial e no fim da Ajuda, com o código do commit publicado (ex.: "Versão 0.5.0 (fcd98c7)"). Assim dá para conferir se o deploy novo chegou ao Render sem entrar na conta.

O número segue `MAJOR.MINOR.PATCH`. Fica em `0.x` até a validação com a cliente; a `1.0.0` marca o app pronto para as usuárias. Funcionalidade nova sobe o MINOR; só correção sobe o PATCH.

## 0.11.0 — 13/11/2026

- **Confirmação de e-mail:** o cadastro com senha manda um link (`/confirmar-email/`). Confirmar não é obrigatório; com o e-mail confirmado, entrar com o Google no mesmo endereço entra na mesma conta, em vez de dar erro. O Perfil mostra se o e-mail está confirmado e tem "Enviar link de confirmação".
- **Abrir mais rápido:** a API fica acordada (Action a cada 10 minutos na `cardvoz-api`), sem a espera de até 1 minuto em "Verificando sua sessão...".
- **Código mais simples:** saiu o caminho antigo usado enquanto a API não tinha as rotas novas. Criar, levar para a conta, estudar e atualizar os baralhos usam uma chamada cada, e repetir um envio não duplica nada.
- Depende da API e da migration `20261113000000_confirmar_email.sql`.

## 0.10.0 — 12/11/2026

- **Revisão espaçada** (pedido da cliente): o CardVoz lembra quando revisar cada ficha. Errou, ela volta na hora; acertou, volta depois de 1 dia, 3 dias, 1 semana, 2 semanas, 1 mês e 3 meses. **Revisar agora** substitui "Estudar só as que errei" na página do baralho e no fim da rodada; sem fichas da vez, o aviso diz a data da próxima revisão. Em Meus baralhos, cada baralho diz quantas fichas há para revisar.
- **Idioma das fichas guardado na conta**: aparece nos outros aparelhos.
- **Exportar e importar** levam também os acertos, os erros e a revisão de cada ficha.
- **Esqueci minha senha**: link por e-mail (válido por 1 hora) para criar uma senha nova. Serve também para quem entra com o Google criar uma senha. Depende do envio de e-mail configurado na API.
- **Perfil**: **Baixar meus dados** e **Excluir conta** (LGPD). Política de privacidade atualizada.
- Depende da API e das migrations `20261112000000_revisao_espacada.sql` e `20261112000100_redefinir_senha.sql`. Com a API antiga, a revisão funciona no aparelho e o idioma fica só nele.

## 0.9.0 — 11/11/2026

- **Acertos e erros** (pedido da cliente): o CardVoz guarda quantas vezes cada ficha foi acertada e errada. A página do baralho, que funciona como a matéria, mostra o total ("No total, 45 acertos e 12 erros. 3 fichas para revisar: você errou na última vez."). Funciona sem conta (no aparelho) e com conta (também no banco); ao levar um baralho para a conta, os números vão junto.
- **Estudar só as que errei:** na página do baralho e no fim da rodada, revisa só as fichas erradas na última vez. Acertou, a ficha sai da lista.
- Menos chamadas à API (parte 4 do modo sem login): o site manda o id gerado no aparelho em `POST /api/decks/import` e `POST /api/study-sessions/complete`, para um envio repetido não duplicar. As rotas estão na branch `feat/estatisticas-das-fichas` da `cardvoz-api`.
- Novo baralho e Adicionar fichas: **Como montar o arquivo** vem antes de **Escolher arquivo** e virou um botão grande (56px de altura, letra de 20px), no lugar do link pequeno no fim da seção. Os exemplos para baixar também viraram botões ("Baixar exemplo em TXT", "em CSV", "em JSON"). Pedido da cliente.
- Contraste revisado nos dois temas. Ajustados os pares que ficavam abaixo de 7:1: botão "Acertei" (5,7:1 → 7,2:1), texto "Errei" no tom suave (6,1:1 → 7,4:1), azul de links sobre o fundo creme (6,9:1 → 7,5:1), texto secundário sobre os fundos suaves (6,8:1 → 7,4:1), azul de links sobre a superfície secundária no tema escuro (6,4:1 → 7,2:1) e a inicial verde dos baralhos (6,9:1 → 7,9:1).
- Contorno de campos, da área "Escolher arquivo" e das caixas de marcar mais escuro (claro) e mais claro (escuro): passou de 1,7:1 para ≥ 3,3:1, o mínimo da WCAG 1.4.11 para achar os controles na tela.

## 0.8.1 — 01/11/2026

- Diálogos de editar ficha e renomear baralho cabem na tela do celular, com o botão "Fechar" visível (issues #10 e #11). A causa era a fileira de botões no fim da página do baralho ("Idioma das fichas", "Exportar baralho", "Renomear baralho", "Excluir baralho"), mais larga que a tela: a página ganhava rolagem lateral e os diálogos esticavam junto. Agora os botões ficam empilhados no celular.
- Nome de baralho ou ficha com palavra longa sem espaço (ex.: um link) quebra a linha em vez de passar da largura da tela.
- `npm run telas`: confere todas as telas no Chromium e no Firefox, de 320 a 412px, procurando rolagem lateral, texto abaixo de 16px e diálogos fora da tela.
- `AGENTS.md` com os combinados da equipe (seção 16), para quem não usa o Claude Code seguir as mesmas regras.

## 0.8.0 — 30/10/2026

- Busca de fichas na página do baralho (RF09): procura na pergunta e na resposta, sem diferenciar acentos, e anuncia quantas fichas encontrou.
- Idioma das fichas: num baralho de inglês ou espanhol, a pessoa escolhe o idioma das perguntas e das respostas, e o leitor de tela pronuncia nesse idioma. Português é o padrão. O idioma vai junto na exportação; por enquanto fica só no aparelho.
- Botões "Editar" e "Excluir" de cada ficha anunciam o número e o começo da pergunta.
- Mensagens de confirmação que se explicam sozinhas ("Ficha 2 de “Biologia” atualizada.").
- Quantidade de fichas anunciada antes da lista ("Fichas (12)").
- Guia de uso (`docs/guia-de-uso.md`) e baralho exportado de exemplo (`docs/exemplos/`).
- Ajuda, perguntas frequentes e README atualizados (busca, idioma).

## 0.7.0 — 30/10/2026

- Ajuda com todos os assuntos abertos (sem toque duplo), cada um com um título; o assunto da tela atual vem primeiro. Novos textos: editar fichas, usar sem internet, exportar.
- Perguntas frequentes atualizadas: instalar no celular e nova pergunta "Funciona sem internet?".
- Política de privacidade revisada para o estado atual (uso sem conta, dados no aparelho, escolha ao sair, exportar) e com os três integrantes da equipe.
- *Campus* em itálico e com inicial maiúscula em todo o site.
- Vocabulário padronizado: "fichas" em vez de "cartões" na página inicial.
- Diálogos de editar ficha e renomear baralho com os campos padrão do projeto (rótulo visível, erro anunciado e foco no campo com problema, contraste AAA).
- Código sem uso removido (componentes Badge e Card, cn(), aviso entre páginas antigo, importação em lote antiga e a dependência clsx).

## 0.6.0 — 30/10/2026

Leitura mais contínua com o TalkBack (pedidos da cliente):

- Matérias da página inicial lidas como uma frase curta ("Exemplos: Biologia, Inglês, ... e muitas outras"), sem ler nome por nome.
- Perguntas frequentes sempre abertas: sem tocar duas vezes para ouvir a resposta; cada pergunta continua sendo um título, para pular entre elas.
- "Funciona com TalkBack e NVDA" lido numa frase só.
- Recursos e passos de "Como funciona" lidos de uma vez (título e texto juntos); subtítulos decorativos removidos.
- Demonstração da página inicial: o tema entra no anúncio da pergunta, sem repetir "1 de 3".
- Estudo: contador e placar visuais não repetem o que o leitor de tela já anuncia.
- Lista de baralhos: nome e quantidade de fichas lidos juntos.
- Página do baralho: pergunta e resposta de cada ficha lidas de uma vez.

## 0.5.0 — 30/10/2026

- Modo sem login: criar, importar, editar e estudar baralhos sem conta, guardados no aparelho.
- Baralhos da conta guardados no aparelho para estudar e editar sem internet, com fila de alterações enviada quando a conexão volta.
- Ao entrar, levar os baralhos do aparelho para a conta (com escolha em caso de nome repetido); ao sair, manter ou apagar os baralhos do aparelho.
- Exportar e importar baralhos em JSON (um ou todos).
- Abrir o site sem internet (service worker) e instalar na tela inicial do celular.
- Estudo enviado de uma vez no fim da rodada (menos chamadas à API).
- Testes automáticos (Vitest) no CI.
- Versão no rodapé e na Ajuda.

## 0.4.0 — 29/10/2026

- Editar e excluir fichas, renomear baralho.
- Baralhos prontos (compartilhados pela equipe) na lista de baralhos.

## 0.3.0 — 23/10/2026

- Login com e-mail e senha e página de cadastro.

## 0.2.0 — 21/10/2026

- Login com Google, página de perfil e menu no cabeçalho.
- Atalhos de uma tecla do estudo opcionais (desligados por padrão).

## 0.1.0 — até 10/10/2026

- Site inicial: landing page, baralhos, fichas, importação de arquivo e estudo com leitor de tela.
