/**
 * Gera out/sw.js depois do `next build`: o service worker que guarda o site no
 * aparelho para o CardVoz abrir sem internet. A versão muda sempre que algum
 * arquivo do site muda, e aí o navegador troca o cache antigo pelo novo.
 *
 * Uso: node scripts/gerar-sw.mjs (já roda no `npm run build`).
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Imagens de apresentação (não usadas pelo app) e arquivos de depuração ficam de fora
const IGNORED = [/^sw\.js$/, /\.map$/, /^assets\//];

function walk(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return walk(full, base);
    return [path.relative(base, full).split(path.sep).join("/")];
  });
}

/** Endereços para guardar: "pasta/index.html" vira "/pasta/" (trailingSlash). */
export function listPrecache(outDir) {
  return walk(outDir)
    .filter((file) => !IGNORED.some((pattern) => pattern.test(file)))
    .map((file) => {
      if (file === "index.html") return "/";
      if (file.endsWith("/index.html")) return `/${file.slice(0, -"index.html".length)}`;
      return `/${file}`;
    })
    .sort();
}

export function buildServiceWorker(template, files, contentHash) {
  const version = createHash("sha256")
    .update(JSON.stringify(files))
    .update(contentHash)
    .digest("hex")
    .slice(0, 12);
  return template.replaceAll("__VERSAO__", version).replaceAll("__ARQUIVOS__", JSON.stringify(files));
}

function hashContents(outDir) {
  const hash = createHash("sha256");
  for (const file of walk(outDir).sort()) {
    if (file === "sw.js") continue;
    hash.update(file).update(readFileSync(path.join(outDir, file)));
  }
  return hash.digest("hex");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const outDir = path.join(root, "out");
  const template = readFileSync(path.join(root, "scripts", "sw-modelo.js"), "utf8");
  const files = listPrecache(outDir);
  writeFileSync(path.join(outDir, "sw.js"), buildServiceWorker(template, files, hashContents(outDir)));
  console.log(`Service worker gerado com ${files.length} arquivos.`);
}
