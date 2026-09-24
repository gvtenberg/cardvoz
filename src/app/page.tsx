import { DeckCard, VoiceCommandHint, Button } from "@/components";
import { Plus, Play } from "lucide-react";
import { getDecks } from "@/lib/api";
import styles from "./page.module.scss";

export const revalidate = 0;

export default async function HomePage() {
  const decks = await getDecks();
  const totalCards = decks.reduce((acc, d) => acc + (d.cardCount || 0), 0);
  const firstDeckSlug = decks[0]?.slug || "biologia-celular";

  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      {/* Workspace Header */}
      <header className={styles.workspaceHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Seus baralhos</h1>
          <p className={styles.pageSubtitle}>
            {decks.length} {decks.length === 1 ? "coleção" : "coleções"} &bull; {totalCards} {totalCards === 1 ? "ficha" : "fichas"} de estudo &bull; Interação por voz e teclado
          </p>
        </div>

        <div className={styles.headerActions}>
          <Button
            href="/baralhos/novo"
            variant="primary"
            aria-label="Criar um novo baralho de fichas"
          >
            <Plus aria-hidden="true" />
            <span>Novo baralho</span>
          </Button>

          <Button
            href={`/estudar?deck=${firstDeckSlug}`}
            variant="secondary"
            aria-label={`Iniciar estudo rápido do baralho ${decks[0]?.title || "principal"}`}
          >
            <Play style={{ fill: "currentColor" }} aria-hidden="true" />
            <span>Prática rápida</span>
          </Button>
        </div>
      </header>

      {/* Voice & Keyboard Navigation Reference */}
      <VoiceCommandHint />

      {/* Decks Collection Section */}
      <section
        id="meus-baralhos"
        aria-labelledby="collection-heading"
        className={styles.collectionSection}
      >
        <div className={styles.sectionHeader}>
          <h2 id="collection-heading" className={styles.sectionTitle}>
            Coleções de estudo
          </h2>
          <span className={styles.sectionMeta}>
            Selecione uma ficha para iniciar a sessão com leitura em voz alta
          </span>
        </div>

        <div className={styles.decksGrid}>
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>
    </main>
  );
}
