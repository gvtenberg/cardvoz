"use client";

import { Button } from "../Button";
import { findLocalDeck } from "@/lib/local/decks";
import type { DeckItem } from "@/lib/data";
import { routes } from "@/lib/routes";
import styles from "./LocalNotice.module.scss";

export interface LocalNoticeProps {
  decks: DeckItem[];
}

/**
 * Aviso fixo (sem foco automático) de que há baralhos só neste aparelho. Quem
 * usa a página decide se mostra (só sem conta ativa).
 */
export function LocalNotice({ decks }: LocalNoticeProps) {
  const deviceDecks = decks.filter((d) => d.kind === "aparelho");
  if (deviceDecks.length === 0) return null;

  // Baralhos que vieram de uma conta: a sessão terminou (ou a pessoa saiu mantendo)
  const cameFromAccount = deviceDecks.some((d) => findLocalDeck(d.id)?.account);
  const text = cameFromAccount
    ? "Sua sessão terminou. Seus baralhos continuam neste aparelho. Entre de novo para guardá-los na conta."
    : "Seus baralhos estão só neste aparelho. Entre na sua conta para guardá-los.";

  return (
    <section className={styles.notice} aria-label="Onde seus baralhos estão guardados">
      <p className={styles.text}>{text}</p>
      <Button href={routes.loginThenReturn(routes.decks)} variant="primary" size="sm">
        Entrar
      </Button>
    </section>
  );
}
