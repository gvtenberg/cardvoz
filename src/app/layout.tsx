import type { Metadata } from "next";
import "@/styles/globals.scss";
import { ThemeProvider } from "@/components/theme-provider";
import { SkipToContent } from "@/components/skip-to-content";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "CardVoz — Fichas de Estudo Acessíveis por Voz",
  description:
    "Fichas de estudo e memorização ativa projetadas para pessoas cegas e com baixa visão. Controle integral por voz e teclado em conformidade com as diretrizes WCAG 2.1.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SkipToContent />
          <Header />
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {children}
          </div>
          <footer
            style={{
              borderTop: "1px solid var(--card-border)",
              backgroundColor: "var(--card-bg)",
              padding: "1.5rem 1.25rem",
              marginTop: "auto",
              fontSize: "0.8125rem",
              color: "var(--text-muted)",
              transition: "background-color 100ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              style={{
                maxWidth: "1120px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <p style={{ fontWeight: 500 }}>
                CardVoz &mdash; Fichas de Estudo e Tecnologia Assistiva
              </p>
              <p style={{ fontSize: "0.75rem", fontFamily: "var(--font-family-mono, monospace)" }}>
                WCAG 2.1 AAA/AA &bull; Navegação por voz e leitor de tela
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
