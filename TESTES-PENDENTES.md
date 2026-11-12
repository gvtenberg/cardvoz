# Testes pendentes: só a fonte dos cartões do GitHub (formato no AGENTS.md, seção 14)

## Entrar e Perfil
> No site publicado (https://cardvoz.onrender.com), de preferência no celular.
### T01 – Entrar com o Google sem demora (v0.13.0)
F: Sem usar o site por uns 30 minutos, abra Entrar, toque em "Entrar com Google" e escolha a conta.
E: Depois de escolher a conta, "Entrando..." dura poucos segundos e Meus baralhos aparece. Comente quantos segundos levou.
### T02 – Link do painel no Perfil (v0.13.0)
F: Entre com uma conta de admin e abra Perfil; toque em "Abrir o painel da equipe".
E: Aparece a seção "Painel da equipe" e o botão abre o painel de administração.
### T03 – Perfil sem o painel para quem não é admin (v0.13.0)
F: Entre com uma conta comum (sem admin) e abra Perfil.
E: A seção "Painel da equipe" não aparece.
### T04 – Esqueci minha senha (v0.10.0)
F: Em Entrar, toque em "Esqueci minha senha", escreva o e-mail de uma conta com senha e abra o link que chegar (veja também o spam).
E: O e-mail chega em poucos minutos; o link abre "Criar uma nova senha" e depois dá para entrar com a senha nova.
### T05 – Confirmar o e-mail (v0.11.0)
F: Crie uma conta com e-mail e senha, abra o link de confirmação do e-mail e depois o Perfil.
E: O Perfil mostra o e-mail como "(confirmado)"; depois disso, "Entrar com Google" com o mesmo e-mail entra na mesma conta.
### T06 – Baixar meus dados e Excluir conta (v0.10.0)
F: Use uma conta criada só para o teste (excluir não tem volta). No Perfil, toque em "Baixar meus dados"; depois em "Excluir conta", confirme com o e-mail e a senha.
E: Um arquivo é baixado; a conta é excluída e os baralhos dela somem do aparelho.

## Baralhos sem login
> Numa aba anônima ou num aparelho que nunca entrou na conta.
### T07 – Criar, importar, editar e estudar sem conta (v0.5.0)
F: Sem entrar, crie um baralho, importe um arquivo de exemplo, edite uma ficha, estude e recarregue a página.
E: Tudo continua lá depois de recarregar, e a lista avisa que os baralhos estão só neste aparelho.
### T08 – Exportar e importar de volta (v0.5.0)
F: Em Meus baralhos, use "Exportar todos"; depois importe o arquivo baixado em Novo baralho > Importar arquivo.
E: Os baralhos voltam com as mesmas fichas e os mesmos acertos e erros.
### T09 – Abrir sem internet (v0.5.0)
F: Abra Meus baralhos e um baralho com internet; ligue o modo avião e abra o site de novo.
E: A lista e o baralho abrem e dá para estudar.
### T10 – Instalar o CardVoz no Android (v0.5.0)
F: No Chrome do Android, termine um estudo e volte para Meus baralhos.
E: Aparece o cartão "Instalar o CardVoz", e tocar nele instala o app na tela inicial.

## Entrar e sair com baralhos no aparelho
### T11 – Levar os baralhos para a conta (v0.5.0)
F: Sem login, crie um baralho com o mesmo nome de um que já está na conta; entre na conta e teste as opções do diálogo. Repita tocando em "Agora não" e depois use o botão na página do baralho.
E: O diálogo pergunta o que fazer com o baralho repetido e cada opção faz o que diz; com "Agora não", o botão da página do baralho leva depois.
### T12 – Editar sem internet com a conta (v0.12.1)
F: Logado, ligue o modo avião, adicione e exclua fichas e estude; desligue o modo avião.
E: Sem internet aparece o aviso de alterações esperando; com internet, "Alterações enviadas" e nada some nem volta.
### T13 – Sair da conta: Manter e Apagar (v0.5.0)
F: No Perfil, toque em "Sair da conta" e escolha "Manter"; entre de novo e saia escolhendo "Apagar". No celular, abra Menu > Sair e cancele.
E: "Manter" deixa os baralhos no aparelho, "Apagar" tira; ao cancelar, o leitor de tela volta para o botão Menu.

## Estudo
### T14 – Revisar agora (v0.12.0)
F: Estude um baralho errando algumas fichas; volte a Meus baralhos e toque em "Revisar agora" nesse baralho.
E: O cartão mostra quantas fichas há para revisar, e a rodada traz só as erradas e as do dia.
### T15 – Baralhos prontos (v0.12.0)
F: Logado, em Meus baralhos, adicione um baralho da seção "Baralhos prontos".
E: Ele entra nos seus baralhos e a seção passa a mostrar "Já está nos seus baralhos." no lugar do botão.

## Leitor de tela e baixa visão
> Com o TalkBack ligado; o ideal é a cliente usar e dar a opinião.
### T16 – Estudar com o TalkBack (v0.6.0)
F: Estude um baralho tocando em "Ver resposta", "Acertei" e "Errei" até o fim.
E: O TalkBack lê sozinho cada pergunta, a resposta e o resultado final, sem precisar procurar na tela.
### T17 – Lista e página do baralho com o TalkBack (v0.12.0)
F: Percorra Meus baralhos e a página de um baralho deslizando o dedo.
E: Nome e quantidade de fichas são lidos juntos, sem paradas repetidas, e os botões dizem de qual baralho são.
### T18 – Zoom de 200% e tema escuro (v0.12.0)
F: Aumente o zoom para 200% e ligue o tema escuro; percorra Meus baralhos, um baralho, o estudo, a Ajuda e o Perfil.
E: Tudo cabe na tela sem rolar para o lado, e os textos e contornos dos botões continuam fáceis de ver.
