import type { Metadata } from "next";
import { Nunito, Inter } from "next/font/google";
import "@/styles/globals.scss";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SkipLink } from "@/components/SkipLink";
import { Header } from "@/components/Header";
import { Logo } from "@/components/Logo";

const nunito = Nunito({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html
      lang="pt-BR"
      className={`${nunito.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SkipLink />
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
              <Logo size="sm" withTagline={false} />
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
