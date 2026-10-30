import path from "node:path";
import { defineConfig } from "vitest/config";

// Testes só da lógica em src/lib (e scripts): rodam no Node, sem navegador.
// O setup cria localStorage/sessionStorage em memória.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    setupFiles: ["src/test/setup.ts"],
    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
  },
});
