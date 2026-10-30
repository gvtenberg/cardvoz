# Histórico de versões do CardVoz

A versão aparece no rodapé da página inicial e no fim da Ajuda, com o código do commit publicado (ex.: "Versão 0.5.0 (fcd98c7)"). Assim dá para conferir se o deploy novo chegou ao Render sem entrar na conta.

O número segue `MAJOR.MINOR.PATCH`. Fica em `0.x` até a validação com a cliente; a `1.0.0` marca o app pronto para as usuárias. Funcionalidade nova sobe o MINOR; só correção sobe o PATCH.

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
