"use client";

import { useEffect, useState } from "react";
import { DeckCard, Button } from "@/components";
import { Plus, Upload } from "lucide-react";
import { getDecks, type DeckResponse } from "@/lib/api";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

export default function HomePage() {
  const [decks, setDecks] = useState<DeckResponse[] | null>(null);

  useEffect(() => {
    getDecks().then(setDecks);
  }, []);

  const totalCards = decks?.reduce((acc, d) => acc + (d.cardCount || 0), 0) ?? 0;

  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Seus baralhos</h1>
          {decks && decks.length > 0 && (
            <p className={styles.pageSubtitle}>
              {decks.length} {decks.length === 1 ? "baralho" : "baralhos"} ·{" "}
              {totalCards} {totalCards === 1 ? "ficha" : "fichas"}
            </p>
          )}
        </div>

        <div className={styles.headerActions}>
          <Button href={routes.newDeck} variant="primary" size="md">
            <Plus aria-hidden="true" />
            <span>Novo baralho</span>
          </Button>
          <Button href={routes.importDeck} variant="soft" size="md">
            <Upload aria-hidden="true" />
            <span>Importar arquivo</span>
          </Button>
        </div>
      </header>

      {decks === null ? (
        <p role="status" className={styles.loading}>
          Carregando baralhos...
        </p>
      ) : decks.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Você ainda não tem baralhos</h2>
          <p className={styles.emptyText}>
            Crie o primeiro baralho e escreva suas perguntas, ou importe um arquivo
            com fichas prontas.
          </p>
        </div>
      ) : (
        <ul className={styles.decksGrid} aria-label="Baralhos">
          {decks.map((deck) => (
            <li key={deck.id}>
              <DeckCard deck={deck} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
