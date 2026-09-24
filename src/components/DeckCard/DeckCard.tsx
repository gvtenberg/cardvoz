import React from "react";
import Link from "next/link";
import { Play, ArrowUpRight } from "lucide-react";
import { Card, CardTitle, CardDescription, CardContent, CardFooter } from "../Card";
import { Badge } from "../Badge";
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

export function DeckCard({ deck }: { deck: DeckProps }) {
  const targetSlug = deck.slug || String(deck.id);

  return (
    <Card as="article" className={styles.deckCard} aria-labelledby={`deck-title-${deck.id}`}>
      <CardContent className={styles.contentWrapper}>
        <div className={styles.metaRow}>
          <Badge variant="category">{deck.category}</Badge>
          <span className={styles.countIndicator}>{deck.cardCount} fichas</span>
        </div>

        <CardTitle id={`deck-title-${deck.id}`} className={styles.title}>
          <Link href={`/baralhos/${targetSlug}`} className={styles.titleLink}>
            {deck.title}
          </Link>
        </CardTitle>

        {deck.description && (
          <CardDescription className={styles.description}>
            {deck.description}
          </CardDescription>
        )}
      </CardContent>

      <CardFooter className={styles.footer}>
        <Button
          href={`/estudar?deck=${targetSlug}`}
          variant="primary"
          size="sm"
          aria-label={`Iniciar estudo por voz do baralho ${deck.title} com ${deck.cardCount} fichas`}
        >
          <Play style={{ fill: "currentColor" }} aria-hidden="true" />
          <span>Estudar ficha</span>
        </Button>

        <Link
          href={`/baralhos/${targetSlug}`}
          className={styles.openLink}
          aria-label={`Abrir detalhes e gerenciar fichas do baralho ${deck.title}`}
        >
          <span>Abrir</span>
          <ArrowUpRight aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
