"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Play, Plus, Trash2,Pencil } from "lucide-react";
import { Button, Dialog, Skeleton, LoadingStatus } from "@/components";
import { errorMessage, type CardResponse } from "@/lib/api";
import { announce, deleteCard, deleteDeck, editCard, renameDeck, useDeck } from "@/lib/data";
import { downloadJson, exportFileName, toExported } from "@/lib/exportDecks";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

function BackLink() {
  return (
    <nav aria-label="Navegação estrutural">
      <Link href={routes.decks} className={styles.backLink}>
        <ArrowLeft aria-hidden="true" />
        <span>Meus baralhos</span>
      </Link>
    </nav>
  );
}

function DeckLoading() {
  return (
    <main id="main-content" className={styles.main}>
      <BackLink />
      <LoadingStatus>Carregando baralho...</LoadingStatus>

      <div aria-hidden="true" className={styles.skeletonGroup}>
        <div className={styles.deckHeader}>
          <div className={styles.skeletonLines}>
            <Skeleton width="65%" height="2.5rem" />
            <Skeleton width="6rem" height="1.25rem" />
          </div>
          <div className={styles.actions}>
            <Skeleton height="4.5rem" radius="1.5rem" className={styles.skeletonButton} />
            <Skeleton height="4.5rem" radius="1.5rem" className={styles.skeletonButton} />
          </div>
        </div>

        <div className={styles.cardsSection}>
          <Skeleton width="6rem" height="2rem" />
          <div className={styles.cardsList}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={styles.cardItem}>
                <Skeleton width="2.5rem" height="2.5rem" radius="9999px" />
                <div className={`${styles.cardContent} ${styles.skeletonLines}`}>
                  <Skeleton width="85%" height="1.25rem" />
                  <Skeleton width="50%" height="1.125rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

function DeckDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deckIdOrSlug = searchParams.get("id") || "";

  const [showRenameModal, setShowRenameModal] = useState(false); 
  const [renameTitle, setRenameTitle] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  // Lido do aparelho e atualizado sozinho quando o baralho muda
  const { deck, loading, error: loadError } = useDeck(deckIdOrSlug);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const [editingCard, setEditingCard] = useState<{ card: CardResponse; index: number } | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [isSavingCard, setIsSavingCard] = useState(false);
  const [cardEditError, setCardEditError] = useState<string | null>(null);

  const [deletingCard, setDeletingCard] = useState<{ card: CardResponse; index: number } | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState(false);

  const handleRename = (e: React.FormEvent) =>{
    e.preventDefault(); 
    const trimmed = renameTitle.trim();

    if (!trimmed) { 
      setRenameError("O nome do baralho não pode ficar vazio."); 
      return; 
    } 
    if (trimmed.length > 200) {
      setRenameError("O nome do baralho deve ter no máximo 200 caracteres."); 
      return; } 

    if (!deck) {
      setRenameError("Baralho não encontrado.");
      return; }
    try { 
        setIsRenaming(true);
        setRenameError(null);
        renameDeck(deck.id, trimmed);
      setStatusMessage("Nome do baralho atualizado."); 
      setShowRenameModal(false);
      } catch (err) { 
        setRenameError(errorMessage(err, "Não foi possível renomear o baralho. Tente novamente.")); 
        } finally { 
        setIsRenaming(false); 
      } 
    };

  const handleDelete = () => {
    if (!deck) return;
    setIsDeleting(true);
    try {
      deleteDeck(deck.id);
      setShowConfirmDelete(false);
      // O baralho some na hora: o aviso vai para o anúncio global e a lista abre já
      announce("Baralho excluído.");
      router.push(routes.decks);
    } catch (error) {
      setIsDeleting(false);
      setShowConfirmDelete(false);
      setStatusMessage(errorMessage(error, "Não foi possível excluir o baralho. Tente novamente."));
    }
  };


const openEditCardModal = (card: CardResponse, index: number) => {
    setEditingCard({ card, index });
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setCardEditError(null);
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !deck) return;

    const trimmedQuestion = editQuestion.trim();
    const trimmedAnswer = editAnswer.trim();

    if (!trimmedQuestion) {
      setCardEditError("A pergunta não pode ficar vazia.");
      return;
    }
    if (!trimmedAnswer) {
      setCardEditError("A resposta não pode ficar vazia.");
      return;
    }

    try {
      setIsSavingCard(true);
      setCardEditError(null);

      editCard(deck.id, editingCard.card.id, { question: trimmedQuestion, answer: trimmedAnswer });
      setStatusMessage(`Ficha ${editingCard.index + 1} atualizada.`);
      setEditingCard(null);
    } catch (err) {
      setCardEditError(errorMessage(err, "Não foi possível salvar a ficha. Tente novamente."));
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleConfirmDeleteCard = () => {
    if (!deletingCard || !deck) return;

    try {
      setIsDeletingCard(true);
      deleteCard(deck.id, deletingCard.card.id);
      setStatusMessage("Ficha excluída.");
      setDeletingCard(null);
    } catch (err) {
      setStatusMessage(errorMessage(err, "Não foi possível excluir a ficha. Tente novamente."));
    } finally {
      setIsDeletingCard(false);
    }
  };

  if (loading) {
    return <DeckLoading />;
  }

  if (loadError) {
    return (
      <main id="main-content" className={styles.main}>
        <BackLink />
        <div className={styles.emptyState}>
          <h1 className={styles.emptyTitle}>O baralho não carregou</h1>
          <p role="alert" className={styles.emptyText}>
            {loadError}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Tentar de novo
          </Button>
        </div>
      </main>
    );
  }

  if (!deck) {
    return (
      <main id="main-content" className={styles.main}>
        <BackLink />
        <div className={styles.emptyState}>
          <h1 className={styles.emptyTitle}>Baralho não encontrado</h1>
          <p className={styles.emptyText}>
            Este baralho não existe mais ou o endereço está incorreto.
          </p>
          <Button href={routes.decks} variant="primary">
            Voltar aos meus baralhos
          </Button>
        </div>
      </main>
    );
  }

  const targetSlug = deck.slug || deck.id;
  const cardList = deck.cards || [];
  const showCategory = deck.category && deck.category.toLowerCase() !== "geral";

  return (
    <main id="main-content" className={styles.main}>
      <p role="status" className={statusMessage ? styles.status : "sr-only"}>
        {statusMessage}
      </p>

      <BackLink />

      <header className={styles.deckHeader}>
        <div>
          <h1 className={styles.title}>{deck.title}</h1>
          <p className={styles.meta}>
            {cardList.length} {cardList.length === 1 ? "ficha" : "fichas"}
            {showCategory && ` · ${deck.category}`}
          </p>
          {deck.description && <p className={styles.description}>{deck.description}</p>}
        </div>

        <div className={styles.actions}>
          {cardList.length > 0 && (
            <Button href={routes.study(targetSlug)} variant="primary" size="lg">
              <Play style={{ fill: "currentColor" }} aria-hidden="true" />
              <span>Estudar</span>
            </Button>
          )}
          <Button
            href={routes.addCards(targetSlug)}
            variant={cardList.length > 0 ? "secondary" : "primary"}
            size="lg"
          >
            <Plus aria-hidden="true" />
            <span>Adicionar fichas</span>
          </Button>
        </div>
      </header>

      <section aria-labelledby="cards-list-heading" className={styles.cardsSection}>
        <h2 id="cards-list-heading" className={styles.sectionTitle}>
          Fichas
        </h2>

        {cardList.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Nenhuma ficha ainda</p>
            <p className={styles.emptyText}>
              Escreva perguntas e respostas ou importe um arquivo para começar a
              estudar.
            </p>
          </div>
        ) : (
          <ol className={styles.cardsList}>
            {cardList.map((card, index) => (
              <li key={card.id || index} className={styles.cardItem}>
                <span className={styles.cardNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={styles.cardContent}>
                  <p className={styles.questionText}>
                    <span className="sr-only">Pergunta: </span>
                    {card.question}
                  </p>
                  <p className={styles.answerText}>
                    <span className="sr-only">Resposta: </span>
                    {card.answer}
                  </p>
                  <div className={styles.cardActions} style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditCardModal(card, index)}
                      aria-label={`Editar ficha ${index + 1}`}
                    >
                      <Pencil aria-hidden="true" style={{ width: "1rem", height: "1rem" }} />
                      <span>Editar</span>
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingCard({ card, index })}
                      aria-label={`Excluir ficha ${index + 1}`}
                    >
                      <Trash2 aria-hidden="true" style={{ width: "1rem", height: "1rem" }} />
                      <span>Excluir</span>
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className={styles.dangerZone}>
        <Button
          variant="soft"
          size="md"
          onClick={() => {
            const fileName = exportFileName(deck.title, new Date());
            downloadJson(fileName, toExported(deck));
            setStatusMessage(`Arquivo “${fileName}” baixado.`);
          }}
          aria-label={`Exportar baralho ${deck.title}`}
        >
          <Download aria-hidden="true" />
          <span>Exportar baralho</span>
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => {
            setRenameTitle(deck.title);
            setRenameError(null);
            setShowRenameModal(true);
          }}
        >
          <span>Renomear baralho</span>
        </Button>
           
        <Button
          variant="danger"
          size="md"
          onClick={() => setShowConfirmDelete(true)}
          aria-haspopup="dialog"
        >
          <Trash2 aria-hidden="true" />
          <span>Excluir baralho</span>
        </Button>
      </div>

      <Dialog
        open={showConfirmDelete}
        onClose={() => !isDeleting && setShowConfirmDelete(false)}
        title="Excluir este baralho?"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowConfirmDelete(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </>
        }
      >
        <p>
          O baralho <strong>{deck.title}</strong> e suas {cardList.length}{" "}
          {cardList.length === 1 ? "ficha" : "fichas"} serão apagados. Não dá para
          desfazer.
        </p>
      </Dialog>
      
      <Dialog
        open={showRenameModal}
        onClose={() => !isRenaming && setShowRenameModal(false)}
        title="Renomear baralho"
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowRenameModal(false)}
              disabled={isRenaming}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="form-renomear"
              variant="primary"
              size="md"
              disabled={isRenaming}
            >
              {isRenaming ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <form id="form-renomear" onSubmit={handleRename} noValidate>
          <label htmlFor="rename-deck-input" className="sr-only">
            Novo nome do baralho
          </label>
          <input
            id="rename-deck-input"
            type="text"
            className={styles.input}
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            maxLength={200}
            disabled={isRenaming}
            autoFocus
          />
          {renameError && (
            <p role="alert" style={{ color: "#d32f2f", marginTop: "0.5rem" }}>
              {renameError}
            </p>
          )}
        </form>
      </Dialog>

      {/* MODAL: Editar Ficha */}
      <Dialog
        open={Boolean(editingCard)}
        onClose={() => !isSavingCard && setEditingCard(null)}
        title={editingCard ? `Editar ficha ${editingCard.index + 1}` : "Editar ficha"}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setEditingCard(null)} disabled={isSavingCard}>
              Cancelar
            </Button>
            <Button type="submit" form="form-editar-ficha" variant="primary" size="md" disabled={isSavingCard}>
              {isSavingCard ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <form id="form-editar-ficha" onSubmit={handleSaveCard} noValidate>
          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="edit-card-question" style={{ fontWeight: "bold", display: "block" }}>
              Pergunta
            </label>
            <textarea
              id="edit-card-question"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "1rem",
                marginTop: "0.25rem",
                minHeight: "80px",
              }}
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              disabled={isSavingCard}
            />
          </div>

          <div>
            <label htmlFor="edit-card-answer" style={{ fontWeight: "bold", display: "block" }}>
              Resposta
            </label>
            <textarea
              id="edit-card-answer"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
                fontSize: "1rem",
                marginTop: "0.25rem",
                minHeight: "80px",
              }}
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              disabled={isSavingCard}
            />
          </div>

          {cardEditError && (
            <p role="alert" style={{ color: "#d32f2f", marginTop: "0.5rem" }}>
              {cardEditError}
            </p>
          )}
        </form>
      </Dialog>

      {/* MODAL: Excluir Ficha */}
      <Dialog
        open={Boolean(deletingCard)}
        onClose={() => !isDeletingCard && setDeletingCard(null)}
        title={deletingCard ? `Excluir a ficha ${deletingCard.index + 1}?` : "Excluir ficha?"}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeletingCard(null)} disabled={isDeletingCard}>
              Cancelar
            </Button>
            <Button variant="danger" size="md" onClick={handleConfirmDeleteCard} disabled={isDeletingCard}>
              {isDeletingCard ? "Excluindo..." : "Sim, excluir"}
            </Button>
          </>
        }
      >
        <p>
          Você tem certeza que deseja excluir a ficha: <strong>{`"${deletingCard?.card.question}"`}</strong>?
        </p>
        <p style={{ marginTop: "0.5rem", color: "#666" }}>Não dá para desfazer.</p>
      </Dialog>
    </main>
  );
}

export default function DeckDetailPage() {
  return (
    <Suspense fallback={<DeckLoading />}>
      <DeckDetailContent />
    </Suspense>
  );
}
