import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildServiceWorker, listPrecache } from "./gerar-sw.mjs";

function fakeOut(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "cardvoz-out-"));
  const files = [
    "index.html",
    "index.txt",
    "baralho/index.html",
    "_next/static/chunks/a.js",
    "_next/static/chunks/a.js.map",
    "sw.js",
    "assets/apresentacao.png",
    "modelos/fichas-exemplo.txt",
  ];
  for (const file of files) {
    mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    writeFileSync(path.join(dir, file), file);
  }
  return dir;
}

describe("gerar service worker", () => {
  it("lista páginas como endereços e deixa de fora o que não precisa", () => {
    const list = listPrecache(fakeOut());
    expect(list).toEqual(
      expect.arrayContaining(["/", "/index.txt", "/baralho/", "/_next/static/chunks/a.js", "/modelos/fichas-exemplo.txt"])
    );
    expect(list).not.toContain("/sw.js");
    expect(list).not.toContain("/_next/static/chunks/a.js.map");
    expect(list).not.toContain("/assets/apresentacao.png");
    expect(list).not.toContain("/index.html");
  });

  it("troca os marcadores e muda a versão quando os arquivos mudam", () => {
    const template = "const V = '__VERSAO__'; const A = __ARQUIVOS__;";
    const a = buildServiceWorker(template, ["/", "/a.js"], "conteudo-1");
    const b = buildServiceWorker(template, ["/", "/a.js"], "conteudo-2");
    expect(a).toContain('const A = ["/","/a.js"];');
    expect(a).not.toContain("__VERSAO__");
    expect(a).not.toBe(b);
  });
});
