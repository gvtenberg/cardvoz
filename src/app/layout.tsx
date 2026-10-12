import type { Metadata } from "next";
import { Nunito, Atkinson_Hyperlegible } from "next/font/google";
import "@/styles/globals.scss";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SkipLink } from "@/components/SkipLink";
import { Header } from "@/components/Header";
import styles from "./layout.module.scss";

const nunito = Nunito({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

// Fonte desenhada pelo Braille Institute para leitores com baixa visão
const atkinson = Atkinson_Hyperlegible({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-atkinson",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CardVoz — Fichas de Estudo Acessíveis",
  description:
    "Fichas de estudo e memorização ativa projetadas para pessoas cegas e com baixa visão, compatíveis com leitores de tela (TalkBack, NVDA e VoiceOver).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${nunito.variable} ${atkinson.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SkipLink />
          <Header />
          <div className={styles.content}>{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
