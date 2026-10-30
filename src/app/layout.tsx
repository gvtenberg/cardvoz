import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Nunito, Atkinson_Hyperlegible } from "next/font/google";
import "@/styles/globals.scss";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SkipLink } from "@/components/SkipLink";
import { Header } from "@/components/Header";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGate } from "@/components/AuthGate";
import { SyncStatus } from "@/components/SyncStatus";
import { AccountTransfer } from "@/components/AccountTransfer";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
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
  title: "CardVoz - Fichas de Estudo Acessíveis",
  description:
    "Fichas de estudo e memorização ativa projetadas para pessoas cegas e com baixa visão, compatíveis com leitores de tela (TalkBack, NVDA e VoiceOver).",
  // Permite instalar o CardVoz na tela inicial e abrir como aplicativo
  manifest: "/manifest.webmanifest",
  // O ícone do iPhone vem de src/app/apple-icon.png (convenção do Next)
  appleWebApp: { capable: true, title: "CardVoz", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#2846C4",
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
        {/* Guarda o aviso de instalação do Chrome que chega antes de o React carregar.
            Código fixo, sem dados de fora */}
        <Script id="cardvoz-instalar" strategy="beforeInteractive">
          {`window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__cardvozInstallPrompt=e;});`}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <SkipLink />
            <Header />
            <SyncStatus />
            <div className={styles.content}>
              <AuthGate>{children}</AuthGate>
            </div>
            <AccountTransfer />
            <ServiceWorkerRegister />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
