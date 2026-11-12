/**
 * Confere todas as telas em larguras de celular, no Chromium e no Firefox:
 * - a página não pode ganhar rolagem lateral (WCAG 1.4.10, reflow a 320px);
 * - nenhum texto visível abaixo de 16px (regra 2 do AGENTS.md);
 * - os diálogos (do baralho e do Perfil) cabem na tela, com o "Fechar" visível.
 *
 * Usa um baralho de exemplo no aparelho (sem login) e repete tudo com nomes
 * longos sem espaço, que costumam alargar a página. O Perfil pede login: lá a
 * API é simulada (nenhum pedido sai do navegador).
 *
 * Uso, com o site rodando (npm run dev ou npx serve out):
 *   npx playwright install chromium firefox   (só na primeira vez)
 *   npm run telas
 *   SITE=http://localhost:3000 npm run telas
 */
import { chromium, firefox } from "playwright";

const SITE = (process.env.SITE || "http://localhost:3000").replace(/\/$/, "");
const LARGURAS = [320, 360, 375, 412];
const PAGINAS = [
  "/", "/entrar/", "/esqueci-senha/", "/redefinir-senha/#codigo=teste", "/confirmar-email/#codigo=teste", "/cadastro/", "/privacidade/", "/perfil/", "/baralhos/",
  "/baralhos/novo/", "/baralho/?id=teste", "/baralho/adicionar/?id=teste", "/estudar/?deck=teste",
  "/estudar/?deck=teste&so=revisar",
];
const API = (process.env.API || "http://localhost:5000/api").replace(/\/$/, "");
// Botões que abrem diálogos, por página. "logado": a página pede a API simulada
const DIALOGOS = [
  {
    caminho: "/baralho/?id=teste",
    botoes: [/^Renomear baralho/, /^Editar ficha 1/, /^Excluir ficha 1/, /^Idioma das fichas/, /^Excluir baralho/],
  },
  { caminho: "/perfil/", logado: true, botoes: [/^Sair da conta/, /^Excluir conta/] },
];

// Respostas mínimas da API para a sessão de teste (o site restaura a sessão pelo /auth/refresh)
async function simularApi(contexto, origem) {
  const agora = new Date().toISOString();
  const cors = {
    "access-control-allow-origin": origem,
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": "authorization, content-type, accept",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
  };
  await contexto.route(`${API}/**`, (rota) => {
    const pedido = rota.request();
    if (pedido.method() === "OPTIONS") return rota.fulfill({ status: 204, headers: cors });
    const url = pedido.url();
    let corpo = [];
    if (url.includes("/auth/refresh")) {
      corpo = {
        accessToken: "teste", accessTokenExpiresAt: agora, refreshToken: "teste", refreshTokenExpiresAt: agora,
        user: {
          id: "00000000-0000-0000-0000-000000000001", name: "Pessoa de Teste",
          email: "teste@example.com", createdAt: agora, hasPassword: true, emailConfirmed: false, isAdmin: true,
        },
      };
    } else if (url.includes("/decks/changes")) {
      corpo = { decks: [], allIds: [], serverTime: agora };
    }
    return rota.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify(corpo) });
  });
}

function baralho(titulo, pergunta) {
  const data = "2026-01-01T00:00:00Z";
  return {
    id: "teste", aliases: [], title: titulo, category: "Geral", description: null,
    sourceDeckId: null, createdAt: data, updatedAt: data, kind: "aparelho", account: null,
    editedOffAccount: false, upload: null,
    cards: [
      // Estudada e errada na última vez: a página mostra os acertos e erros e "Revisar agora"
      { id: "f1", question: pergunta, answer: "4", displayOrder: 0, createdAt: data,
        correctCount: 1, incorrectCount: 2, lastAnsweredAt: data, lastWasCorrect: false },
      { id: "f2", question: "Quanto é 3²?", answer: "9", displayOrder: 1, createdAt: data },
    ],
  };
}

const CENARIOS = [
  ["normal", baralho("Matemática", "Quanto é 2+2?")],
  ["nomes longos", baralho(
    "Fotossíntese_e_Respiração_Celular_Bioquímica",
    "https://pt.wikipedia.org/wiki/Teorema_fundamental_do_c%C3%A1lculo",
  )],
];

// Roda dentro da página: rolagem lateral e textos pequenos
function medirPagina() {
  const largura = document.documentElement.clientWidth;
  const rolagem = document.documentElement.scrollWidth - largura;
  const pequenos = [...document.querySelectorAll("body *")]
    .filter((el) =>
      [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
      el.getClientRects().length > 0 &&
      !el.closest(".sr-only") &&
      parseFloat(getComputedStyle(el).fontSize) < 16)
    .slice(0, 3)
    .map((el) => `"${el.textContent.trim().slice(0, 30)}" (${getComputedStyle(el).fontSize})`);
  return { rolagem, pequenos };
}

function medirDialogo() {
  const largura = document.documentElement.clientWidth;
  const dialogo = [...document.querySelectorAll("dialog")].find((d) => d.open);
  if (!dialogo) return "o diálogo não abriu";
  const caixa = dialogo.getBoundingClientRect();
  const fechar = dialogo.querySelector('[aria-label="Fechar"]').getBoundingClientRect();
  const painel = dialogo.firstElementChild;
  if (document.documentElement.scrollWidth > largura) return "a página ganhou rolagem lateral";
  if (caixa.left < 0 || caixa.right > largura) return "o diálogo passa da tela";
  if (fechar.right > largura) return "o botão Fechar ficou fora da tela";
  if (painel.scrollWidth > painel.clientWidth) return "o conteúdo do diálogo passa da largura";
  return null;
}

const problemas = [];
let conferidos = 0;

for (const [nome, tipo] of [["Chromium", chromium], ["Firefox", firefox]]) {
  let navegador;
  try {
    navegador = await tipo.launch();
  } catch {
    console.warn(`${nome} não está instalado: rode "npx playwright install ${nome.toLowerCase()}".`);
    continue;
  }
  for (const [cenario, deck] of CENARIOS) {
    for (const largura of LARGURAS) {
      const contexto = await navegador.newContext({
        viewport: { width: largura, height: 800 },
        ...(nome === "Chromium" ? { isMobile: true, hasTouch: true } : {}),
      });
      await contexto.addInitScript((d) => localStorage.setItem("cardvoz.baralhos.v1", JSON.stringify([d])), deck);
      const pagina = await contexto.newPage();
      const onde = (caminho) => `${nome}, ${largura}px, ${cenario}: ${caminho}`;

      for (const caminho of PAGINAS) {
        await pagina.goto(SITE + caminho);
        await pagina.waitForLoadState("networkidle");
        const { rolagem, pequenos } = await pagina.evaluate(medirPagina);
        conferidos++;
        if (rolagem > 0) problemas.push(`${onde(caminho)} rolagem lateral de ${rolagem}px`);
        if (pequenos.length) problemas.push(`${onde(caminho)} texto abaixo de 16px: ${pequenos.join(", ")}`);
      }

      for (const { caminho, logado, botoes } of DIALOGOS) {
        // Sessão de teste numa aba própria, sem os baralhos do aparelho (eles abririam
        // o "Levar para sua conta?" logo ao entrar)
        let aba = pagina;
        let contextoLogado = null;
        if (logado) {
          contextoLogado = await navegador.newContext({
            viewport: { width: largura, height: 800 },
            ...(nome === "Chromium" ? { isMobile: true, hasTouch: true } : {}),
          });
          await contextoLogado.addInitScript(() => localStorage.setItem("cardvoz.refreshToken", "teste"));
          await simularApi(contextoLogado, new URL(SITE).origin);
          aba = await contextoLogado.newPage();
        }
        await aba.goto(SITE + caminho);
        await aba.waitForLoadState("networkidle");
        for (const botao of botoes) {
          const alvo = aba.getByRole("button", { name: botao }).first();
          conferidos++;
          try {
            await alvo.scrollIntoViewIfNeeded({ timeout: 5000 });
            await alvo.click({ timeout: 5000 });
          } catch {
            // Coberto por outro elemento ou fora da tela: a pessoa também não conseguiria tocar
            problemas.push(`${onde(`${caminho} botão ${botao.source.slice(1)}`)} não dá para tocar`);
            continue;
          }
          await aba.waitForTimeout(300);
          const erro = await aba.evaluate(medirDialogo);
          if (erro) problemas.push(`${onde(`${caminho} diálogo ${botao.source.slice(1)}`)} ${erro}`);
          await aba.keyboard.press("Escape");
          await aba.waitForTimeout(200);
        }
        if (contextoLogado) await contextoLogado.close();
      }
      await contexto.close();
    }
  }
  await navegador.close();
}

if (problemas.length) {
  console.error(`${problemas.length} problema(s) em ${conferidos} conferências:\n- ${problemas.join("\n- ")}`);
  process.exit(1);
}
console.log(`Tudo certo: ${conferidos} conferências sem rolagem lateral, texto pequeno ou diálogo fora da tela.`);
