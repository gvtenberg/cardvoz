import Link from "next/link";
import { Play, Layers, ArrowRight } from "lucide-react";
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
      <div>
        <div className={styles.topRow}>
          <span className={styles.categoryBadge}>
            {deck.category}
          </span>
          <span className={styles.countBadge}>
            <Layers aria-hidden="true" />
            <span>{deck.cardCount} cartões</span>
          </span>
        </div>

        <h3 id={`deck-title-${deck.id}`} className={styles.title}>
          {deck.title}
        </h3>

        <p className={styles.description}>
          {deck.description}
        </p>
      </div>

      <div className={styles.footer}>
        <Link
          href={`/estudar?deck=${deck.id}`}
          className={styles.studyButton}
          aria-label={`Iniciar estudo por voz do baralho ${deck.title}`}
        >
          <Play style={{ fill: "currentColor" }} aria-hidden="true" />
          <span>Estudar agora</span>
        </Link>

        <Link
          href={`/baralhos/${deck.id}`}
          className={styles.detailsLink}
          aria-label={`Ver detalhes e cartões do baralho ${deck.title}`}
        >
          <span>Detalhes</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
