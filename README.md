# CardVoz &mdash; Flashcards Acessíveis com Controle por Voz

O **CardVoz** é uma plataforma moderna e inclusiva de estudo ativo por flashcards projetada com foco prioritário em **pessoas cegas e com baixa visão**. Desenvolvido com **Next.js 15 (App Router)**, **TypeScript**, **SCSS Modules**, arquitetura modular de estilos Sass e suporte a temas claro/escuro de alto contraste via **next-themes**.

---

## Pilares de Acessibilidade (WCAG 2.1 AA / AAA)

- **Leitor de tela nativo, sem áudio próprio**: O site não fala sozinho, para não sobrepor o TalkBack, NVDA ou VoiceOver. A cada ficha o foco vai para a pergunta (e, ao revelar, para a resposta), então o leitor de tela lê o conteúdo automaticamente.
- **Botão "Acertei" direto**: Disponível antes mesmo de revelar a resposta e sempre na mesma posição da tela, para avançar rápido nas revisões.
- **Letras e botões grandes**: Nenhum texto abaixo de 16px, fonte Atkinson Hyperlegible (criada para baixa visão) e botões de estudo com 72px+ de altura.
- **Atalhos de teclado (opcionais)**: desligados por padrão, porque o leitor de tela também usa teclas soltas (WCAG 2.1.4). A pessoa liga na Ajuda, em "Atalhos do teclado", e a escolha fica salva no aparelho. Sem eles, o estudo funciona com Tab e Enter nos botões.
  - `Espaço`: Ver a resposta da pergunta atual.
  - `Tecla 1`: Marcar que acertou (funciona também antes de revelar).
  - `Tecla 2`: Marcar que errou.
- **Importação de fichas**: Arquivos TXT, CSV ou JSON (exemplos em `public/modelos/`). TXT aceita uma ficha por linha (`pergunta; resposta`), blocos separados por linha em branco ou linhas `P:`/`R:`; CSV aceita vírgula ou ponto e vírgula, com ou sem cabeçalho; JSON aceita uma lista de fichas ou `{ "titulo": "...", "fichas": [...] }`.
- **Conta com e-mail e senha ou com Google**: a pessoa cria a conta com nome, e-mail e senha (com "Mostrar senha", porque o leitor de tela não lê o que foi digitado num campo de senha) ou toca em "Entrar com Google" e escolhe a conta; nesse caso, na primeira vez a conta no CardVoz é criada sozinha. Usamos nosso próprio botão e a página inteira do Google (nada de janela que abre sozinha), e a sessão dura 30 dias no aparelho.
- **Ajuda contextual**: Botão "Ajuda" no topo abre um diálogo que já mostra a explicação da tela atual.
- **Skip Link ("Pular para o conteúdo principal")**: Acesso rápido ao `<main id="main-content">` para usuários de tecnologias assistivas e leitores de tela (NVDA, Orca, TalkBack).
- **Semântica Rigorosa WAI-ARIA**: Uso estruturado de `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, regiões ao vivo `aria-live` e descrições claras em `aria-label`.
- **Foco Visível de Alto Contraste**: Anéis de foco destacados com offset (`outline: 3px solid var(--ring)` e `outline-offset: 3px`) garantindo identificação imediata do elemento focado.

---

## Design Tokens & Arquitetura SCSS (WCAG AAA / AA)

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

## Como Executar

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

Crie um `.env.local` (veja o `.env.example`) com:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api          # cardvoz-api rodando localmente
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com
```

Todas as páginas, exceto a inicial, `/entrar/`, `/cadastro/` e `/privacidade/`, pedem login. Sem a API, só essas quatro funcionam. Sem `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, o site funciona só com e-mail e senha.

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
- Variáveis de ambiente (gravadas no build; ao mudar, refaça o deploy):
  - `NEXT_PUBLIC_API_URL=https://<sua-api>.onrender.com/api`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com`

**API (`cardvoz-api`)**
- `CORS_ALLOWED_ORIGINS=https://<seu-site>.onrender.com` para liberar o site a chamar a API.
- `GOOGLE_CLIENT_ID` (o mesmo do site) e `GOOGLE_CLIENT_SECRET`.

**Ordem ao publicar mudanças de login:** primeiro a migration do `cardvoz-db` (`npx supabase db push`), depois a API, por último o site. O site novo chama `/api/auth/google`, que só existe na API nova.

---

## Login com Google: como configurar

O site manda a pessoa ao Google (fluxo *authorization code* com PKCE) e o Google a devolve para `/entrar/`. A API troca o código pelo `id_token` usando o segredo do cliente, que nunca vai para o navegador. É preciso criar um **ID do cliente OAuth** uma vez, com uma conta Google da equipe:

1. Abra o [Google Cloud Console](https://console.cloud.google.com/) e crie um projeto (ex.: `CardVoz`).
   - **Use uma conta Gmail pessoal.** Contas de estudante do IFTO (Google Workspace) não têm permissão para criar projetos: só aparece "No organization" e o aviso `resourcemanager.projects.create`. A conta que cria o projeto não limita quem entra no CardVoz.
   - Depois de criar, adicione as outras pessoas da equipe em **IAM e administrador → IAM → Conceder acesso**, com o papel **Proprietário**, para a configuração não depender de uma conta só.
2. No menu, abra **APIs e serviços → Tela de consentimento OAuth** (em algumas contas aparece como **Google Auth Platform**) e toque em **Começar**:
   - Nome do app: `CardVoz`; e-mail de suporte: o da equipe.
   - Público: **Externo**.
   - Informe um e-mail de contato e aceite os termos.
3. Em **Branding** (Identidade visual), preencha a página inicial (`https://<seu-site>.onrender.com/`) e a política de privacidade (`https://<seu-site>.onrender.com/privacidade/`). Se pedir domínio autorizado, use `<seu-site>.onrender.com`.
4. Em **Público-alvo**, escolha uma opção:
   - **Publicar app** (recomendado): qualquer conta Google consegue entrar. Como o CardVoz só pede nome e e-mail (escopos `openid email profile`), o Google não exige verificação.
   - **Manter em teste**: só entram os e-mails cadastrados em **Usuários de teste** (até 100). Serve para os testes, mas lembre de cadastrar cada participante.
5. Em **Clientes** (ou **Credenciais → Criar credenciais → ID do cliente OAuth**), crie um cliente do tipo **Aplicativo da Web**:
   - **Origens JavaScript autorizadas:** `http://localhost:3000` e `https://<seu-site>.onrender.com`
   - **URIs de redirecionamento autorizados** (exatamente assim, com a barra final): `http://localhost:3000/entrar/` e `https://<seu-site>.onrender.com/entrar/`
6. Copie o **ID do cliente** e a **Chave secreta do cliente**. O segredo pode aparecer só uma vez: baixe o JSON e guarde fora do repositório.
7. Configure as variáveis:
   - Site (Render, Static Site): `NEXT_PUBLIC_GOOGLE_CLIENT_ID` e refaça o deploy.
   - API (Render, Web Service): `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
   - Local: `.env.local` do site e `.env` da API.

Mudanças no Google podem levar alguns minutos para valer. Os erros mais comuns:

| Erro na tela do Google | Causa |
|---|---|
| `redirect_uri_mismatch` | O endereço `/entrar/` não está cadastrado igual no passo 5 (confira `http`/`https` e a barra final) |
| `access_denied` ou "app em teste" | O app está em teste e o e-mail não está em Usuários de teste |
| "Acesso bloqueado" ou "app bloqueado pelo administrador" | A instituição bloqueia apps de terceiros nas contas de estudante. Entre com uma conta Gmail pessoal |
| `disallowed_useragent` | O link foi aberto dentro de um app que o Google bloqueia (ex.: Instagram). Abra no Chrome |

Se o botão "Entrar com Google" não aparecer, falta `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no build. Se a API responder 503, faltam as variáveis dela.

---

## Estrutura do Projeto

```
cardvoz/
├── legacy-prototypes/          # Protótipos estáticos originais preservados
├── public/modelos/             # Arquivos de exemplo para importação (TXT, CSV, JSON)
├── docs/                       # Logotipo e tarefas da equipe
├── src/
│   ├── app/                    # Páginas (todas "use client")
│   │   ├── layout.tsx          # Fontes, tema, sessão (AuthProvider + AuthGate) e cabeçalho
│   │   ├── page.tsx            # Landing page (pública)
│   │   ├── entrar/             # Entrar com e-mail e senha ou Google; recebe a volta do Google (pública)
│   │   ├── cadastro/           # Criar conta com nome, e-mail e senha (pública)
│   │   ├── privacidade/        # Política de privacidade (pública)
│   │   ├── perfil/             # Dados da conta e "Sair da conta"
│   │   ├── baralhos/           # Lista de baralhos (+ novo/)
│   │   ├── baralho/            # Detalhe do baralho (?id=slug) (+ adicionar/)
│   │   └── estudar/            # Sessão de estudo (?deck=slug)
│   ├── components/             # Um componente por pasta (Header com menu, AuthProvider, AuthGate...)
│   ├── lib/
│   │   ├── api.ts              # Cliente da API (token, renovação no 401, ApiError)
│   │   ├── http.ts             # URL da API, ApiError e mensagens de erro
│   │   ├── auth/session.ts     # Tokens, renovação entre abas e logout
│   │   ├── auth/google.ts      # Ida e volta do Google (PKCE)
│   │   ├── notice.ts           # Aviso que sobrevive a uma troca de página
│   │   ├── routes.ts           # Endereços internos e páginas públicas
│   │   └── importCards.ts      # Leitura de fichas de arquivos TXT/CSV/JSON
│   └── styles/                 # Tokens, mixins e temas claro/escuro
├── AGENTS.md                   # Guia de referência para agentes de IA (regras e arquitetura)
└── next.config.mjs             # Export estático (out/)
```
