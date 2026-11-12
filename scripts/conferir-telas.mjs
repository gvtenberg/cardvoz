/**
 * Confere todas as telas em larguras de celular, no Chromium e no Firefox:
 * - a página não pode ganhar rolagem lateral (WCAG 1.4.10, reflow a 320px);
 * - nenhum texto visível abaixo de 16px (regra 2 do AGENTS.md);
 * - os diálogos da página do baralho cabem na tela, com o "Fechar" visível.
 *
 * Usa um baralho de exemplo no aparelho (sem login) e repete tudo com nomes
 * longos sem espaço, que costumam alargar a página.
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
  "/", "/entrar/", "/esqueci-senha/", "/redefinir-senha/#codigo=teste", "/cadastro/", "/privacidade/", "/perfil/", "/baralhos/",
  "/baralhos/novo/", "/baralho/?id=teste", "/baralho/adicionar/?id=teste", "/estudar/?deck=teste",
  "/estudar/?deck=teste&so=revisar",
];
// Botões que abrem diálogos na página do baralho
const DIALOGOS = [/^Renomear baralho/, /^Editar ficha 1/, /^Excluir ficha 1/, /^Idioma das fichas/, /^Excluir baralho/];

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

      await pagina.goto(`${SITE}/baralho/?id=teste`);
      await pagina.waitForLoadState("networkidle");
      for (const botao of DIALOGOS) {
        const alvo = pagina.getByRole("button", { name: botao }).first();
        conferidos++;
        try {
          await alvo.scrollIntoViewIfNeeded();
          await alvo.click({ timeout: 5000 });
        } catch {
          // Coberto por outro elemento ou fora da tela: a pessoa também não conseguiria tocar
          problemas.push(`${onde(`botão ${botao.source.slice(1)}`)} não dá para tocar`);
          continue;
        }
        await pagina.waitForTimeout(300);
        const erro = await pagina.evaluate(medirDialogo);
        if (erro) problemas.push(`${onde(`diálogo ${botao.source.slice(1)}`)} ${erro}`);
        await pagina.keyboard.press("Escape");
        await pagina.waitForTimeout(200);
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
