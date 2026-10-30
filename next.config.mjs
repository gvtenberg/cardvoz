import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Versão mostrada no rodapé e na Ajuda: número do package.json e commit do
// build. No Render vem de RENDER_GIT_COMMIT; localmente, do git.
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

function currentCommit() {
  if (process.env.RENDER_GIT_COMMIT) return process.env.RENDER_GIT_COMMIT;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Site estático: `npm run build` gera a pasta `out/`, publicável em qualquer
  // hospedagem estática. Os dados vêm da API C# direto do navegador.
  output: "export",
  // Cada página vira pasta/index.html (ex.: /estudar/index.html)
  trailingSlash: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
    NEXT_PUBLIC_APP_COMMIT: currentCommit(),
  },
};

export default nextConfig;
