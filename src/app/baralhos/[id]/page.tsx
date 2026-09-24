"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Plus, Trash2, AlertCircle } from "lucide-react";
import { Badge, Button } from "@/components";
import { getDeck, deleteDeck, type DeckDetailResponse } from "@/lib/api";
import styles from "./page.module.scss";

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckIdOrSlug = (params?.id as string) || "";

  const [deck, setDeck] = useState<DeckDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadDeck = useCallback(async () => {
    if (!deckIdOrSlug) return;
    setLoading(true);
    try {
      const data = await getDeck(deckIdOrSlug);
      setDeck(data);
    } catch (err) {
      console.error("Erro ao carregar baralho:", err);
    } finally {
      setLoading(false);
    }
  }, [deckIdOrSlug]);

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);

  const handleDelete = async () => {
    if (!deck) return;
    setIsDeleting(true);
    try {
      await deleteDeck(deck.id);
      setStatusMessage("Baralho excluído com sucesso. Redirecionando...");
      setTimeout(() => {
        router.push("/");
      }, 600);
    } catch (error) {
      console.error(error);
      setIsDeleting(false);
      setShowConfirmDelete(false);
      setStatusMessage("Erro ao excluir o baralho. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <main id="main-content" className={styles.main}>
        <nav aria-label="Navegação estrutural" className={styles.navBar}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" />
            <span>Voltar para todos os baralhos</span>
          </Link>
        </nav>
        <p className={styles.sectionSubtitle}>Carregando informações do baralho...</p>
      </main>
    );
  }

  if (!deck) {
    return (
      <main id="main-content" className={styles.main}>
        <nav aria-label="Navegação estrutural" className={styles.navBar}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" />
            <span>Voltar para todos os baralhos</span>
          </Link>
        </nav>
        <div className={styles.emptyState}>
          <AlertCircle style={{ width: "2rem", height: "2rem", color: "var(--destructive)" }} aria-hidden="true" />
          <h1 className={styles.emptyTitle}>Baralho não encontrado</h1>
          <p className={styles.emptySubtitle}>
            O baralho solicitado não pôde ser localizado ou foi removido.
          </p>
          <Button href="/" variant="secondary">
            Voltar aos meus baralhos
          </Button>
        </div>
      </main>
    );
  }

  const targetSlug = deck.slug || String(deck.id);
  const cardList = deck.cards || [];

  return (
    <main id="main-content" className={styles.main}>
      {/* Live Region for Screen Readers */}
      <div aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <nav aria-label="Navegação estrutural" className={styles.navBar}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Voltar para todos os baralhos</span>
        </Link>
      </nav>

      {/* Deck Header Summary */}
      <header aria-labelledby="deck-detail-heading" className={styles.deckHeader}>
        <div className={styles.deckMeta}>
          <div className={styles.topMeta}>
            <Badge variant="category">{deck.category}</Badge>
            <span className={styles.cardsCount}>{cardList.length} fichas cadastradas</span>
          </div>

          <h1 id="deck-detail-heading" className={styles.title}>
            {deck.title}
          </h1>
          {deck.description && <p className={styles.description}>{deck.description}</p>}
        </div>

        <div className={styles.actionsGroup}>
          <Button
            href={`/estudar?deck=${targetSlug}`}
            variant="primary"
            size="sm"
            aria-label={`Iniciar estudo por voz do baralho ${deck.title}`}
          >
            <Play style={{ fill: "currentColor" }} aria-hidden="true" />
            <span>Estudar fichas</span>
          </Button>

          <Button
            href={`/baralhos/${targetSlug}/novo-cartao`}
            variant="secondary"
            size="sm"
            aria-label={`Adicionar nova ficha ao baralho ${deck.title}`}
          >
            <Plus aria-hidden="true" />
            <span>Nova ficha</span>
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowConfirmDelete(true)}
            aria-label={`Excluir baralho ${deck.title}`}
          >
            <Trash2 aria-hidden="true" />
            <span>Excluir baralho</span>
          </Button>
        </div>
      </header>

      {/* Cards List in Catalog Index Style */}
      <section aria-labelledby="cards-list-heading" className={styles.cardsSection}>
        <div className={styles.sectionHeader}>
          <h2 id="cards-list-heading" className={styles.sectionTitle}>
            Fichas cadastradas ({cardList.length})
          </h2>
          <span className={styles.sectionSubtitle}>
            Ordem de apresentação durante o estudo por voz
          </span>
        </div>

        {cardList.length === 0 ? (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>Nenhuma ficha neste baralho</h3>
            <p className={styles.emptySubtitle}>
              Comece adicionando perguntas e respostas para praticar a memorização ativa por voz.
            </p>
            <Button href={`/baralhos/${targetSlug}/novo-cartao`} variant="primary" size="sm">
              <Plus aria-hidden="true" />
              <span>Adicionar primeira ficha</span>
            </Button>
          </div>
        ) : (
          <div className={styles.cardsList}>
            {cardList.map((card, index) => (
              <article key={card.id || index} className={styles.cardItem}>
                <div className={styles.cardNumberColumn}>
                  <span className={styles.cardNumber}>#{index + 1}</span>
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.qaBlock}>
                    <span className={styles.fieldLabel}>Pergunta</span>
                    <p className={styles.questionText}>{card.question}</p>
                  </div>

                  <div className={styles.qaDivider} aria-hidden="true" />

                  <div className={styles.qaBlock}>
                    <span className={styles.answerLabel}>Resposta</span>
                    <p className={styles.answerText}>{card.answer}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Accessible Delete Confirmation Dialog */}
      {showConfirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
          className={styles.deleteConfirmDialog}
        >
          <div className={styles.confirmCard}>
            <h2 id="confirm-delete-title" className={styles.confirmTitle}>
              Excluir este baralho?
            </h2>
            <p className={styles.confirmMessage}>
              Tem certeza de que deseja excluir <strong>{deck.title}</strong> e todas as suas {cardList.length} fichas de estudo? Esta ação não pode ser desfeita.
            </p>
            <div className={styles.confirmActions}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Confirmar exclusão"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
