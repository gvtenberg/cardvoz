import Link from "next/link";
import { ArrowLeft, Play, PlusCircle, HelpCircle, CheckCircle2 } from "lucide-react";
import styles from "./page.module.scss";

interface Props {
  params: Promise<{ id: string }>;
}

const SAMPLE_DECKS: Record<
  string,
  {
    title: string;
    category: string;
    description: string;
    cards: { question: string; answer: string }[];
  }
> = {
  "biologia-celular": {
    title: "Biologia Celular",
    category: "Ciências Biológicas",
    description:
      "Estruturas celulares, organelas, respiração celular, fotossíntese e funções da membrana plasmática.",
    cards: [
      {
        question:
          "Qual organela celular é responsável pela produção de energia (ATP) por meio da respiração celular?",
        answer: "A mitocôndria.",
      },
      {
        question:
          "Qual estrutura delimita a célula e controla a entrada e saída de substâncias?",
        answer: "A membrana plasmática (ou plasmalema).",
      },
      {
        question: "Qual organela é responsável pela síntese de proteínas nas células?",
        answer: "Os ribossomos.",
      },
      {
        question:
          "Qual organela realiza a fotossíntese nas células vegetais e algas?",
        answer: "Os cloroplastos.",
      },
    ],
  },
  "ingles-verbos-irregulares": {
    title: "Inglês - Verbos Irregulares",
    category: "Idiomas",
    description:
      "Formas infinitivo, passado simples (Past Simple) e particípio passado (Past Participle) dos verbos mais usados.",
    cards: [
      {
        question: "Qual é o passado simples (Past Simple) e particípio de 'to go'?",
        answer: "Went (passado simples) e Gone (particípio).",
      },
      {
        question: "Qual é o passado simples e particípio de 'to write'?",
        answer: "Wrote (passado simples) e Written (particípio).",
      },
    ],
  },
};

export default async function DeckDetailPage({ params }: Props) {
  const { id } = await params;
  const deck = SAMPLE_DECKS[id] || {
    title: id.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    category: "Estudos Gerais",
    description: "Baralho de estudos e prática.",
    cards: [
      {
        question: "Exemplo de pergunta para este baralho?",
        answer: "Exemplo de resposta correspondente.",
      },
    ],
  };

  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Navegação estrutural">
        <Link href="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Voltar para todos os baralhos</span>
        </Link>
      </nav>

      {/* Deck Header */}
      <section aria-labelledby="deck-detail-heading" className={styles.deckHeader}>
        <div>
          <span className={styles.categoryBadge}>
            {deck.category}
          </span>
          <h1 id="deck-detail-heading" className={styles.title}>
            {deck.title}
          </h1>
          <p className={styles.description}>
            {deck.description}
          </p>
        </div>

        <div className={styles.actionsGroup}>
          <Link
            href={`/estudar?deck=${id}`}
            className={styles.studyBtn}
          >
            <Play style={{ fill: "currentColor" }} aria-hidden="true" />
            <span>Estudar Baralho</span>
          </Link>

          <Link
            href={`/baralhos/${id}/novo-cartao`}
            className={styles.addCardBtn}
          >
            <PlusCircle aria-hidden="true" />
            <span>Adicionar Cartão</span>
          </Link>
        </div>
      </section>

      {/* Cards List */}
      <section aria-labelledby="cards-list-heading" className={styles.cardsSection}>
        <div className={styles.sectionHeader}>
          <h2 id="cards-list-heading" className={styles.sectionTitle}>
            Cartões Cadastrados ({deck.cards.length})
          </h2>
          <span className={styles.sectionSubtitle}>
            Ordenados pela sequência de estudo
          </span>
        </div>

        <div className={styles.cardsList}>
          {deck.cards.map((card, index) => (
            <article key={index} className={styles.cardItem}>
              <span className={styles.cardNumber}>
                {index + 1}
              </span>
              <div className={styles.cardContent}>
                <div>
                  <h3 className={styles.label}>
                    <HelpCircle style={{ color: "var(--primary)" }} aria-hidden="true" />
                    <span>Pergunta</span>
                  </h3>
                  <p className={styles.questionText}>
                    {card.question}
                  </p>
                </div>
                <div>
                  <h4 className={styles.label}>
                    <CheckCircle2 style={{ color: "var(--success)" }} aria-hidden="true" />
                    <span>Resposta</span>
                  </h4>
                  <p className={styles.answerText}>
                    {card.answer}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
