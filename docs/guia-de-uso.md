# Guia de uso do CardVoz

O CardVoz é um site de fichas de estudo (perguntas e respostas) feito para pessoas cegas e com baixa visão. Funciona com o leitor de tela do seu aparelho: **TalkBack** no Android e **NVDA** no Windows. O site não tem voz própria; quem lê é o seu leitor de tela.

**Endereço:** https://cardvoz.onrender.com

Na primeira visita do dia, o site pode demorar até um minuto para abrir, porque o servidor gratuito "acorda". Depois fica rápido.

---

## 1. Começar

1. Abra o endereço no navegador do celular (Chrome no Android) ou do computador.
2. Toque em **Começar a estudar**. Você não precisa criar conta: seus baralhos ficam guardados no próprio aparelho.
3. Em qualquer tela, o botão **Ajuda**, no topo, explica o que fazer. O assunto da tela atual aparece primeiro.

## 2. Criar um baralho e as fichas

1. Em **Meus baralhos**, toque em **Novo baralho**, escreva um nome (por exemplo, "Biologia") e toque em **Criar baralho**.
2. Na página do baralho, toque em **Adicionar fichas**.
3. Escreva a **Pergunta** e a **Resposta** e toque em **Salvar ficha**. O CardVoz avisa "1ª ficha salva", "2ª ficha salva"... e o cursor volta para a pergunta, para você escrever a próxima.
4. Quando terminar, toque em **Concluir**.

Dica: os campos aceitam o ditado por voz do teclado do celular.

## 3. Importar fichas de um arquivo

Se você já tem uma lista de perguntas, em **Importar arquivo** escolha um arquivo:

- **TXT:** uma ficha por linha, com pergunta e resposta separadas por ponto e vírgula. Exemplo: `Capital do Brasil?; Brasília`
- **CSV:** planilha com as colunas pergunta e resposta.
- **JSON:** o arquivo exportado pelo próprio CardVoz.

Há arquivos de exemplo na Ajuda e em `public/modelos/` neste repositório.

## 4. Estudar

1. Na página do baralho, toque em **Estudar**. O leitor de tela lê a primeira pergunta sozinho.
2. Pense na resposta e toque em **Ver resposta** para conferir.
3. Toque em **Acertei** ou **Errei**. O botão **Acertei** fica sempre no mesmo lugar, à direita, e funciona mesmo sem abrir a resposta.
4. No fim, o CardVoz diz quantas você acertou. Toque em **Estudar de novo** para repetir.

No computador, dá para ligar atalhos de uma tecla na Ajuda: Espaço mostra a resposta, 1 marca "Acertei" e 2 marca "Errei".

## 5. Corrigir, buscar e organizar

Na página do baralho:

- **Editar** e **Excluir** ficam em cada ficha. O leitor de tela diz o número e o começo da pergunta, para você saber qual está alterando.
- **Buscar fichas** procura na pergunta e na resposta, sem se importar com acentos, e diz quantas fichas encontrou.
- **Renomear baralho** e **Excluir baralho** ficam no fim da página.

## 6. Baralhos de outro idioma

Num baralho de inglês ou espanhol, toque em **Idioma das fichas** e escolha o idioma das perguntas e das respostas. Assim o leitor de tela troca a voz e pronuncia "irregular verbs" em inglês, e não com a pronúncia do português. Português é o padrão.

## 7. Guardar uma cópia e levar para outro aparelho

- **Exportar baralho** (na página do baralho) ou **Exportar todos** (em Meus baralhos) baixa um arquivo com suas fichas.
- Para trazer de volta, use **Importar arquivo**. Um exemplo de baralho exportado está em `docs/exemplos/cardvoz-ingles-basico.json`.

## 8. Conta (opcional)

Com uma conta, seus baralhos ficam guardados também na internet, e você pode usá-los em outro aparelho.

- Entre com **e-mail e senha** ou com **Entrar com Google**. Marque **Mostrar senha** para conferir o que digitou.
- Se você já tinha baralhos no aparelho, o CardVoz pergunta se quer **levá-los para a conta**.
- Ao **Sair da conta**, você escolhe se os baralhos continuam no aparelho ou são apagados dele. Eles continuam guardados na conta.

## 9. Sem internet e na tela inicial

- Depois de abrir o CardVoz uma vez, ele funciona **sem internet**: dá para estudar, criar e editar. Com conta, as alterações vão para ela quando a conexão voltar.
- Para abrir como um aplicativo, **instale na tela inicial**: no Android, menu do Chrome (três pontos) e **Instalar app**; no iPhone, Safari, **Compartilhar** e **Adicionar à Tela de Início**. O próprio CardVoz sugere isso depois do primeiro estudo.

## 10. Versão e contato

A versão aparece no rodapé da página inicial e no fim da Ajuda. Dúvidas, sugestões ou pedidos sobre seus dados: fale com a equipe do projeto (Élida Cristina, Gutemberg Oliveira e Heitor Oliveira, do IFTO, *Campus* Palmas). A política de privacidade está no rodapé do site.
