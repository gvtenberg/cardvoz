# CardVoz &mdash; Flashcards Acessíveis com Controle por Voz

O **CardVoz** é uma plataforma moderna e inclusiva de estudo ativo por flashcards projetada com foco prioritário em **pessoas cegas e com baixa visão**. Desenvolvido com **Next.js 15 (App Router)**, **TypeScript**, **SCSS Modules**, arquitetura modular de estilos Sass e suporte a temas claro/escuro de alto contraste via **next-themes**.

---

## 🌟 Pilares de Acessibilidade (WCAG 2.1 AA / AAA)

- **Leitura e Síntese de Voz (TTS)**: Suporte integrado para leitura falada das perguntas e respostas através da Web Speech API.
- **Navegação por Teclado e Voz**:
  - `Espaço`: Revelar resposta da pergunta atual.
  - `Tecla 1`: Marcar que acertou.
  - `Tecla 2`: Marcar que errou / enviar para revisão.
  - `Tecla R`: Repetir a leitura de áudio da pergunta/resposta.
- **Skip Link ("Pular para o conteúdo principal")**: Acesso rápido ao `<main id="main-content">` para usuários de tecnologias assistivas e leitores de tela (NVDA, Orca, TalkBack).
- **Semântica Rigorosa WAI-ARIA**: Uso estruturado de `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, regiões ao vivo `aria-live` e descrições claras em `aria-label`.
- **Foco Visível de Alto Contraste**: Anéis de foco destacados com offset (`outline: 3px solid var(--ring)` e `outline-offset: 3px`) garantindo identificação imediata do elemento focado.

---

## 🎨 Design Tokens & Arquitetura SCSS (WCAG AAA / AA)

Inspirado em práticas modernas de design (21st.dev) e conformidade estrita com as diretrizes WCAG:

### Modo Claro
- **Background**: `#F8FAFC` (slate-50)
- **Superfície / Card**: `#FFFFFF` com borda `#E2E8F0`
- **Azul Primário**: `#1D4ED8` (blue-700) e `#2563EB` (blue-600)
- **Texto Principal**: `#0F172A` (slate-900) &mdash; Razão de contraste ~18:1 (AAA)
- **Texto Secundário / Muted**: `#475569` (slate-600) &mdash; Razão de contraste ~7.4:1 (AAA)
- **Anel de Foco**: `#2563EB` (anel visível com offset de 3px)

### Modo Escuro
- **Background**: `#0B0F19` (midnight navy)
- **Superfície / Card**: `#131C2E` com borda `#1E293B`
- **Azul Primário**: `#38BDF8` / `#60A5FA` (azul celeste vivo de alto contraste)
- **Texto Principal**: `#F8FAFC` (slate-50) &mdash; Razão de contraste ~19:1 (AAA)
- **Texto Secundário / Muted**: `#94A3B8` (slate-400) &mdash; Razão de contraste ~8.5:1 (AAA)
- **Anel de Foco**: `#38BDF8` (anel visível com offset de 3px)

### Cores de Estado
- **Sucesso / Acertei**: `#16A34A` (claro) / `#22C55E` (escuro)
- **Erro / Errei**: `#DC2626` (claro) / `#EF4444` (escuro)

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

### Build de Produção

```bash
npm run build
npm run start
```

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
│   │   └── baralhos/
│   │       ├── novo/           # Criação de novo baralho
│   │       └── [id]/           # Detalhes do baralho e adição de cartões
│   ├── components/
│   │   ├── deck-card.tsx       # Card acessível de apresentação de baralho
│   │   ├── header.tsx          # Cabeçalho semântico com navegação e tema
│   │   ├── skip-to-content.tsx # Skip-link acessível
│   │   ├── theme-provider.tsx  # Provedor next-themes
│   │   ├── theme-toggle.tsx    # Seletor de tema acessível
│   │   └── voice-command-hint.tsx # Instruções de voz e teclado
│   ├── styles/
│   │   ├── _variables.scss     # Tokens de cores azul (light/dark), tipografia e raios
│   │   ├── _mixins.scss        # Mixins SCSS (foco WCAG AAA, botões, cards)
│   │   └── globals.scss        # CSS Custom Properties dinâmicas e reset
│   └── lib/
│       └── utils.ts            # Utilitário de classes condicionais (clsx)
├── package.json
├── tsconfig.json
├── next.config.mjs
└── .eslintrc.json
```
