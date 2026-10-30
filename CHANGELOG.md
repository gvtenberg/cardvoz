# Histórico de versões do CardVoz

A versão aparece no rodapé da página inicial e no fim da Ajuda, com o código do commit publicado (ex.: "Versão 0.5.0 (fcd98c7)"). Assim dá para conferir se o deploy novo chegou ao Render sem entrar na conta.

O número segue `MAJOR.MINOR.PATCH`. Fica em `0.x` até a validação com a cliente; a `1.0.0` marca o app pronto para as usuárias. Funcionalidade nova sobe o MINOR; só correção sobe o PATCH.

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
