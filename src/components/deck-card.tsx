import Link from "next/link";
import { Play, ArrowUpRight } from "lucide-react";
import styles from "./DeckCard.module.scss";

export interface DeckProps {
  id: string;
  title: string;
  category: string;
  cardCount: number;
  lastStudied?: string;
  description: string;
}

export function DeckCard({ deck }: { deck: DeckProps }) {
  return (
    <article
      className={styles.card}
      aria-labelledby={`deck-title-${deck.id}`}
    >
      <div className={styles.cardTop}>
        <div className={styles.metaRow}>
          <span className={styles.categoryTag}>{deck.category}</span>
          <span className={styles.countIndicator}>{deck.cardCount} fichas</span>
        </div>

        <h3 id={`deck-title-${deck.id}`} className={styles.title}>
          <Link href={`/baralhos/${deck.id}`} className={styles.titleLink}>
            {deck.title}
          </Link>
        </h3>

        <p className={styles.description}>{deck.description}</p>
      </div>

      <div className={styles.cardBottom}>
        <Link
          href={`/estudar?deck=${deck.id}`}
          className={styles.studyBtn}
          aria-label={`Iniciar estudo por voz do baralho ${deck.title} com ${deck.cardCount} fichas`}
        >
          <Play style={{ fill: "currentColor" }} aria-hidden="true" />
          <span>Estudar ficha</span>
        </Link>

        <Link
          href={`/baralhos/${deck.id}`}
          className={styles.openLink}
          aria-label={`Abrir detalhes e gerenciar fichas do baralho ${deck.title}`}
        >
          <span>Abrir</span>
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
