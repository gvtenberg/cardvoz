"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "../Button";
import { neverShowInstall, shouldShowInstallCard, snoozeInstall, useInstallPrompt } from "@/lib/install";
import styles from "./InstallCard.module.scss";

/**
 * Sugere instalar o CardVoz na tela inicial. Fica na lista de baralhos, sem
 * abrir sozinho nem roubar o foco do leitor de tela.
 */
export function InstallCard() {
  const { prompt, platform, standalone } = useInstallPrompt();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowInstallCard({ now: Date.now(), standalone, platform, hasPrompt: Boolean(prompt) }));
  }, [prompt, platform, standalone]);

  if (!visible) return null;

  // Ao fechar, o foco volta para o início da página (o cartão some)
  const close = () => {
    setVisible(false);
    document.getElementById("main-content")?.focus();
  };

  return (
    <section className={styles.card} aria-labelledby="instalar-titulo">
      <h2 id="instalar-titulo" className={styles.title}>
        Instalar o CardVoz
      </h2>
      <p className={styles.text}>Abra o CardVoz direto da tela inicial, como um aplicativo.</p>
      {platform === "ios" && (
        <p className={styles.text}>Toque em Compartilhar e depois em Adicionar à Tela de Início.</p>
      )}
      <div className={styles.actions}>
        {platform === "android" && prompt && (
          <Button
            variant="primary"
            size="md"
            onClick={async () => {
              await prompt();
              close();
            }}
          >
            <Download aria-hidden="true" />
            <span>Instalar o CardVoz</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            snoozeInstall(Date.now());
            close();
          }}
        >
          Agora não
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={() => {
            neverShowInstall();
            close();
          }}
        >
          Não mostrar mais
        </Button>
      </div>
    </section>
  );
}
