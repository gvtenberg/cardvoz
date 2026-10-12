# CardVoz &mdash; Flashcards Acessíveis com Controle por Voz

O **CardVoz** é uma plataforma moderna e inclusiva de estudo ativo por flashcards projetada com foco prioritário em **pessoas cegas e com baixa visão**. Desenvolvido com **Next.js 15 (App Router)**, **TypeScript**, **SCSS Modules**, arquitetura modular de estilos Sass e suporte a temas claro/escuro de alto contraste via **next-themes**.

---

## 🌟 Pilares de Acessibilidade (WCAG 2.1 AA / AAA)

- **Leitor de tela nativo, sem áudio próprio**: O site não fala sozinho, para não sobrepor o TalkBack, NVDA ou VoiceOver. A cada ficha o foco vai para a pergunta (e, ao revelar, para a resposta), então o leitor de tela lê o conteúdo automaticamente.
- **Botão "Acertei" direto**: Disponível antes mesmo de revelar a resposta e sempre na mesma posição da tela, para avançar rápido nas revisões.
- **Letras e botões grandes**: Nenhum texto abaixo de 16px, fonte Atkinson Hyperlegible (criada para baixa visão) e botões de estudo com 72px+ de altura.
- **Atalhos de teclado**:
  - `Espaço`: Ver a resposta da pergunta atual.
  - `Tecla 1`: Marcar que acertou (funciona também antes de revelar).
  - `Tecla 2`: Marcar que errou.
- **Importação de fichas**: Arquivos TXT, CSV ou JSON (exemplos em `public/modelos/`). TXT aceita uma ficha por linha (`pergunta; resposta`), blocos separados por linha em branco ou linhas `P:`/`R:`; CSV aceita vírgula ou ponto e vírgula, com ou sem cabeçalho; JSON aceita uma lista de fichas ou `{ "titulo": "...", "fichas": [...] }`.
- **Ajuda contextual**: Botão "Ajuda" no topo abre um diálogo que já mostra a explicação da tela atual.
- **Skip Link ("Pular para o conteúdo principal")**: Acesso rápido ao `<main id="main-content">` para usuários de tecnologias assistivas e leitores de tela (NVDA, Orca, TalkBack).
- **Semântica Rigorosa WAI-ARIA**: Uso estruturado de `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, regiões ao vivo `aria-live` e descrições claras em `aria-label`.
- **Foco Visível de Alto Contraste**: Anéis de foco destacados com offset (`outline: 3px solid var(--ring)` e `outline-offset: 3px`) garantindo identificação imediata do elemento focado.

---

## 🎨 Design Tokens & Arquitetura SCSS (WCAG AAA / AA)

Inspirado em práticas modernas de design (21st.dev) e conformidade estrita com as diretrizes WCAG:

### Modo Claro
- **Fundo**: `#F7F4EE` (creme suave, menos ofuscante que branco puro)
- **Superfície / Ficha**: `#FFFFFF` com borda `#E7E1D6` e cantos de 24–32px
- **Azul de ação**: `#2846C4` &mdash; 7.6:1 com texto branco (AAA)
- **Títulos**: `#18215A` &mdash; ~15:1 (AAA)
- **Texto secundário**: `#4B5165` &mdash; ~7.2:1 (AAA)

### Modo Escuro
- **Fundo**: `#12151F` / **Superfície**: `#1B2030`
- **Azul de ação**: `#8FA8FF` com texto `#0D1433` &mdash; ~7.9:1 (AAA)
- **Texto principal**: `#F1F3F9` &mdash; ~16:1 (AAA)
- **Texto secundário**: `#B7BDD2` &mdash; ~9.7:1 (AAA)

### Cores de Estado
- **Acertei**: `#1C7543` (claro) / `#6FD39A` (escuro)
- **Errei**: fundo `#FDE9E7` com texto `#9B1C1C` (claro) / fundo `#3A2225` com texto `#FFC2BD` (escuro)

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18.17+ ou 20+
- npm 9+

### Instalação e Execução Local

```bash
# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

### Build de Produção (site estático)

O CardVoz é exportado como **site estático** (`output: "export"`): o build gera a pasta `out/`, que pode ser publicada em qualquer hospedagem estática. Os dados vêm da API C# chamada direto pelo navegador.

```bash
npm run build      # gera a pasta out/
npx serve out      # pré-visualização local do resultado
```

### Deploy no Render

**Site (Static Site)**
- Build Command: `npm install && npm run build`
- Publish Directory: `out`
- Variável de ambiente: `NEXT_PUBLIC_API_URL=https://<sua-api>.onrender.com/api` (gravada no build; ao mudar, refaça o deploy)

**API (`cardvoz-api`)**
- Variável de ambiente: `CORS_ALLOWED_ORIGINS=https://<seu-site>.onrender.com` para liberar o site a chamar a API.

---

## 📁 Estrutura do Projeto

```
cardvoz/
├── legacy-prototypes/           # Protótipos estáticos originais preservados
│   ├── README.md               # Histórico acadêmico dos protótipos
│   ├── index .html
│   ├── criar-baralho.html
│   ├── criar-cartao.html
│   └── estudar.html
├── src/
│   ├── app/
│   │   ├── layout.tsx          # RootLayout, ThemeProvider e SkipLink
│   │   ├── page.tsx            # Página inicial com baralhos e atalhos
│   │   ├── page.module.scss    # Estilos SCSS da página inicial
│   │   ├── estudar/
│   │   │   ├── page.tsx        # Fluxo de estudo ativo por voz e teclado
│   │   │   └── page.module.scss# Estilos SCSS do estudo ativo
│   │   ├── baralhos/
│   │   │   └── novo/           # Criação de novo baralho (com importação)
│   │   └── baralho/            # Detalhes do baralho (?id=slug)
│   │       └── adicionar/      # Adição de fichas e importação (?id=slug)
│   ├── components/
│   │   ├── deck-card.tsx       # Card acessível de apresentação de baralho
│   │   ├── header.tsx          # Cabeçalho semântico com navegação e tema
│   │   ├── skip-to-content.tsx # Skip-link acessível
│   │   ├── theme-provider.tsx  # Provedor next-themes
│   │   ├── theme-toggle.tsx    # Seletor de tema acessível
│   │   ├── HelpDialog/         # Ajuda contextual (diálogo nativo)
│   │   └── FileImport/         # Seleção e prévia de arquivos TXT/CSV/JSON
│   ├── styles/
│   │   ├── _variables.scss     # Tokens de cores azul (light/dark), tipografia e raios
│   │   ├── _mixins.scss        # Mixins SCSS (foco WCAG AAA, botões, cards)
│   │   └── globals.scss        # CSS Custom Properties dinâmicas e reset
│   └── lib/
│       ├── api.ts              # Cliente da API C# com fallback local
│       ├── importCards.ts      # Leitura de fichas de arquivos TXT/CSV/JSON
│       └── utils.ts            # Utilitário de classes condicionais (clsx)
├── package.json
├── tsconfig.json
├── next.config.mjs
└── .eslintrc.json
```
