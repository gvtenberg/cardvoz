/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Site estático: `npm run build` gera a pasta `out/`, publicável em qualquer
  // hospedagem estática. Os dados vêm da API C# direto do navegador.
  output: "export",
  // Cada página vira pasta/index.html (ex.: /estudar/index.html)
  trailingSlash: true,
};

export default nextConfig;
