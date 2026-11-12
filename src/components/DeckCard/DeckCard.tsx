import React from "react";
import { Play, RotateCcw } from "lucide-react";
import { routes } from "@/lib/routes";
import { Button } from "../Button";
import { Skeleton } from "../Skeleton";
import styles from "./DeckCard.module.scss";

export interface DeckProps {
  id: string | number;
  slug?: string;
  title: string;
  category: string;
  cardCount: number;
  /** Fichas para "Revisar agora" */
  dueCount?: number;
  lastStudied?: string;
  description?: string | null;
}

const TONES = [styles.tone0, styles.tone1, styles.tone2, styles.tone3, styles.tone4];

export function DeckCard({ deck }: { deck: DeckProps }) {
  const targetSlug = deck.slug || String(deck.id);
  const tone = TONES[Math.abs(Number(deck.id) || deck.title.length) % TONES.length];
  const showCategory = deck.category && deck.category.toLowerCase() !== "geral";
  const due = deck.dueCount ?? 0;

  return (
    <article className={styles.deckCard} aria-labelledby={`deck-title-${deck.id}`}>
      <div className={styles.top}>
        <span className={`${styles.avatar} ${tone}`} aria-hidden="true">
          {deck.title.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className={styles.info}>
          {/* Título sem link: o leitor de tela para no nome e depois só nos botões.
              Com link, o nome e "Ver fichas" eram duas paradas para o mesmo lugar */}
          <h2 id={`deck-title-${deck.id}`} className={styles.title}>
            {deck.title}
            {/* O leitor de tela lê nome e quantidade de uma vez */}
            <span className="sr-only">
              , {deck.cardCount} {deck.cardCount === 1 ? "ficha" : "fichas"}
              {showCategory && `, ${deck.category}`}
              {due > 0 && `, ${due} para revisar agora`}
            </span>
          </h2>
          <p className={styles.meta} aria-hidden="true">
            {deck.cardCount} {deck.cardCount === 1 ? "ficha" : "fichas"}
            {showCategory && ` · ${deck.category}`}
          </p>
          {due > 0 && (
            <p className={styles.due} aria-hidden="true">
              {due} para revisar agora
            </p>
          )}
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
        {/* Saber por onde começar sem abrir cada baralho */}
        {due > 0 && (
          <Button
            href={routes.review(targetSlug)}
            variant="secondary"
            size="md"
            block
            aria-label={`Revisar agora (${due}) ${deck.title}`}
          >
            <RotateCcw aria-hidden="true" />
            <span>Revisar agora ({due})</span>
          </Button>
        )}
        <Button
          href={routes.deck(targetSlug)}
          variant="secondary"
          size="md"
          block
          className={due > 0 ? styles.wide : undefined}
          aria-label={`Ver fichas de ${deck.title}`}
        >
          Ver fichas
        </Button>
      </div>
    </article>
  );
}

/** Versão de carregamento do cartão, com o mesmo tamanho do cartão real. */
export function DeckCardSkeleton() {
  return (
    <div className={styles.deckCard} aria-hidden="true">
      <div className={styles.top}>
        <Skeleton width="3.5rem" height="3.5rem" radius="1.5rem" />
        <div className={`${styles.info} ${styles.skeletonInfo}`}>
          <Skeleton width="70%" height="1.5rem" />
          <Skeleton width="40%" height="1.125rem" />
        </div>
      </div>
      <div className={styles.actions}>
        <Skeleton height="3.5rem" radius="9999px" />
        <Skeleton height="3.5rem" radius="9999px" />
      </div>
    </div>
  );
}
