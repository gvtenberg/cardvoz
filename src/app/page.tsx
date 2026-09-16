import Link from "next/link";
import { DeckCard, type DeckProps } from "@/components/deck-card";
import { VoiceCommandHint } from "@/components/voice-command-hint";
import { Sparkles, Plus, BookOpen, Volume2, ShieldCheck } from "lucide-react";
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
  return (
    <main id="main-content" tabIndex={-1} style={{ outline: "none" }}>
      {/* Hero Section */}
      <section aria-labelledby="hero-title" className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Sparkles aria-hidden="true" />
              <span>Tecnologia Assistiva e Aprendizado Inclusivo</span>
            </div>

            <h1 id="hero-title" className={styles.title}>
              Estude flashcards com a liberdade da{" "}
              <span className={styles.highlight}>
                sua própria voz
              </span>
            </h1>

            <p className={styles.description}>
              O CardVoz é uma plataforma de memorização ativa projetada para
              pessoas cegas, com baixa visão ou que preferem interagir por comandos
              de áudio. Sem barreiras visuais, 100% navegável por voz e teclado.
            </p>

            <div className={styles.actions}>
              <Link
                href="/estudar?deck=biologia-celular"
                className={styles.primaryBtn}
                aria-label="Começar a estudar o primeiro baralho: Biologia Celular"
              >
                <Volume2 aria-hidden="true" />
                <span>Começar Estudo Rápido</span>
              </Link>

              <Link
                href="/baralhos/novo"
                className={styles.secondaryBtn}
              >
                <Plus aria-hidden="true" />
                <span>Criar Novo Baralho</span>
              </Link>
            </div>

            {/* Accessibility badges */}
            <div className={styles.trustBadges}>
              <span className={styles.trustItem}>
                <ShieldCheck aria-hidden="true" />
                Alto Contraste WCAG AAA
              </span>
              <span className={styles.trustItem}>
                <ShieldCheck aria-hidden="true" />
                Compatível com Leitores de Tela (NVDA / Orca / TalkBack)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className={styles.contentWrapper}>
        {/* Voice Navigation Hint */}
        <VoiceCommandHint />

        {/* Decks Section */}
        <section
          id="meus-baralhos"
          aria-labelledby="decks-heading"
          className={styles.decksSection}
        >
          <div className={styles.decksHeader}>
            <div>
              <h2 id="decks-heading" className={styles.decksTitle}>
                <BookOpen aria-hidden="true" />
                <span>Meus Baralhos</span>
              </h2>
              <p className={styles.decksSubtitle}>
                Selecione um baralho para praticar ou revisar seus cartões.
              </p>
            </div>

            <Link
              href="/baralhos/novo"
              className={styles.addDeckLink}
            >
              <Plus aria-hidden="true" />
              <span>Adicionar Baralho</span>
            </Link>
          </div>

          <div className={styles.decksGrid}>
            {INITIAL_DECKS.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
