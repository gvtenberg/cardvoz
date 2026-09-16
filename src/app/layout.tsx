import type { Metadata } from "next";
import "@/styles/globals.scss";
import { ThemeProvider } from "@/components/theme-provider";
import { SkipToContent } from "@/components/skip-to-content";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "CardVoz - Flashcards Acessíveis com Controle por Voz",
  description:
    "Aplicativo inclusivo de estudo por flashcards voltado para pessoas cegas e com baixa visão, com controle completo por voz e suporte a leitores de tela.",
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
              padding: "1.75rem 1rem",
              marginTop: "auto",
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              transition: "background-color 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div
              style={{
                maxWidth: "1200px",
                margin: "0 auto",
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <p>
                CardVoz &copy; {new Date().getFullYear()} &mdash; Projeto de Extensão Universitária em Acessibilidade
              </p>
              <p style={{ fontSize: "0.75rem" }}>
                Em conformidade com as diretrizes WCAG 2.1 (Níveis AA e AAA)
              </p>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
