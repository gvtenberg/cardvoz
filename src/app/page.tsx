import Link from "next/link";
import { DeckCard, type DeckProps } from "@/components/deck-card";
import { VoiceCommandHint } from "@/components/voice-command-hint";
import { Plus, Play } from "lucide-react";
import styles from "./page.module.scss";

const INITIAL_DECKS: DeckProps[] = [
  {
    id: "biologia-celular",
    title: "Biologia Celular",
    category: "Ciências Biológicas",
    cardCount: 15,
    description:
      "Estruturas celulares, organelas, respiração celular, fotossíntese e funções da membrana plasmática.",
  },
  {
    id: "ingles-verbos-irregulares",
    title: "Inglês - Verbos Irregulares",
    category: "Idiomas",
    cardCount: 30,
    description:
      "Formas infinitivo, passado simples (Past Simple) e particípio passado (Past Participle) dos verbos mais usados.",
  },
  {
    id: "historia-do-brasil",
    title: "História do Brasil - República Velha",
    category: "Humanidades",
    cardCount: 18,
    description:
      "Movimentos sociais, política do café com leite, revoltas populares e a transição para a Era Vargas.",
  },
  {
    id: "acessibilidade-web",
    title: "Acessibilidade na Web & WCAG",
    category: "Tecnologia",
    cardCount: 22,
    description:
      "Critérios de conformidade WCAG 2.1 níveis A, AA e AAA, navegação por teclado e semântica WAI-ARIA.",
  },
];

export default function HomePage() {
  const totalCards = INITIAL_DECKS.reduce((acc, d) => acc + d.cardCount, 0);

  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      {/* Workspace Header */}
      <header className={styles.workspaceHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Seus baralhos</h1>
          <p className={styles.pageSubtitle}>
            {INITIAL_DECKS.length} coleções &bull; {totalCards} fichas de estudo &bull; Interação por voz e teclado
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link
            href="/baralhos/novo"
            className={styles.primaryAction}
            aria-label="Criar um novo baralho de fichas"
          >
            <Plus aria-hidden="true" />
            <span>Novo baralho</span>
          </Link>

          <Link
            href="/estudar?deck=biologia-celular"
            className={styles.secondaryAction}
            aria-label="Iniciar estudo rápido do baralho Biologia Celular"
          >
            <Play style={{ fill: "currentColor" }} aria-hidden="true" />
            <span>Prática rápida</span>
          </Link>
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
          {INITIAL_DECKS.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </section>
    </main>
  );
}
