import React from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { routes } from "@/lib/routes";
import { Button } from "../Button";
import styles from "./DeckCard.module.scss";

export interface DeckProps {
  id: string | number;
  slug?: string;
  title: string;
  category: string;
  cardCount: number;
  lastStudied?: string;
  description?: string | null;
}

const TONES = [styles.tone0, styles.tone1, styles.tone2, styles.tone3, styles.tone4];

export function DeckCard({ deck }: { deck: DeckProps }) {
  const targetSlug = deck.slug || String(deck.id);
  const tone = TONES[Math.abs(Number(deck.id) || deck.title.length) % TONES.length];
  const showCategory = deck.category && deck.category.toLowerCase() !== "geral";

  return (
    <article className={styles.deckCard} aria-labelledby={`deck-title-${deck.id}`}>
      <div className={styles.top}>
        <span className={`${styles.avatar} ${tone}`} aria-hidden="true">
          {deck.title.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className={styles.info}>
          <h2 id={`deck-title-${deck.id}`} className={styles.title}>
            <Link href={routes.deck(targetSlug)} className={styles.titleLink}>
              {deck.title}
            </Link>
          </h2>
          <p className={styles.meta}>
            {deck.cardCount} {deck.cardCount === 1 ? "ficha" : "fichas"}
            {showCategory && ` · ${deck.category}`}
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          href={routes.study(targetSlug)}
          variant="primary"
          size="md"
          block
          aria-label={`Estudar ${deck.title}`}
        >
          <Play style={{ fill: "currentColor" }} aria-hidden="true" />
          <span>Estudar</span>
        </Button>
        <Button
          href={routes.deck(targetSlug)}
          variant="secondary"
          size="md"
          block
          aria-label={`Ver fichas de ${deck.title}`}
        >
          Ver fichas
        </Button>
      </div>
    </article>
  );
}
