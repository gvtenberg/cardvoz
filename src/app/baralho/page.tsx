"use client";

import React, { useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Languages, Play, Plus, Trash2, Pencil, Upload } from "lucide-react";
import { Button, Dialog, Input, Select, Skeleton, LoadingStatus, Textarea, useAuth } from "@/components";
import { errorMessage, type CardResponse } from "@/lib/api";
import { announce, deleteCard, deleteDeck, editCard, renameDeck, setDeckLanguages, useDeck } from "@/lib/data";
import { LANGUAGES, langAttr, languageName } from "@/lib/languages";
import { filterCards, resultsText } from "@/lib/searchCards";
import { downloadJson, exportFileName, toExported } from "@/lib/exportDecks";
import { requestTransfer } from "@/lib/data/transfer";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

/** Começo da pergunta para o nome dos botões: diz a qual ficha cada um se refere */
function shortQuestion(text: string): string {
  return text.length > 50 ? `${text.slice(0, 47).trimEnd()}...` : text;
}

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
  const { status: authStatus } = useAuth();

  // Lido do aparelho e atualizado sozinho quando o baralho muda
  const { deck, loading, error: loadError } = useDeck(deckIdOrSlug);
  const [statusMessage, setStatusMessage] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const renameRef = useRef<HTMLInputElement>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameError, setRenameError] = useState("");

  const questionRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const [editingCard, setEditingCard] = useState<{ card: CardResponse; index: number } | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [questionError, setQuestionError] = useState("");
  const [answerError, setAnswerError] = useState("");
  // Falha ao gravar (ex.: espaço do aparelho cheio): não é erro de um campo
  const [cardFormError, setCardFormError] = useState("");

  const [deletingCard, setDeletingCard] = useState<{ card: CardResponse; index: number } | null>(null);

  const [query, setQuery] = useState("");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [questionLang, setQuestionLang] = useState("pt-BR");
  const [answerLang, setAnswerLang] = useState("pt-BR");

  const openLanguageModal = () => {
    setQuestionLang(deck?.questionLang ?? "pt-BR");
    setAnswerLang(deck?.answerLang ?? "pt-BR");
    setShowLanguageModal(true);
  };

  const handleSaveLanguages = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck) return;
    // Português é o idioma da página: guarda null para não marcar nada
    const toStored = (code: string) => (code === "pt-BR" ? null : code);
    try {
      setDeckLanguages(deck.id, { questionLang: toStored(questionLang), answerLang: toStored(answerLang) });
      setStatusMessage(
        `Idioma de “${deck.title}”: perguntas em ${languageName(questionLang).toLowerCase()}, respostas em ${languageName(answerLang).toLowerCase()}.`
      );
    } catch (err) {
      setStatusMessage(errorMessage(err, "Não foi possível salvar o idioma. Tente novamente."));
    }
    setShowLanguageModal(false);
  };

  // Salvar no aparelho é instantâneo: não há estado "Salvando..." nos diálogos
  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck) return;
    const trimmed = renameTitle.trim();
    if (!trimmed) {
      setRenameError("Escreva um nome para o baralho.");
      renameRef.current?.focus();
      return;
    }
    try {
      renameDeck(deck.id, trimmed);
      setStatusMessage(`Baralho renomeado para “${trimmed}”.`);
      setShowRenameModal(false);
    } catch (err) {
      setRenameError(errorMessage(err, "Não foi possível renomear o baralho. Tente novamente."));
      renameRef.current?.focus();
    }
  };

  const handleDelete = () => {
    if (!deck) return;
    try {
      deleteDeck(deck.id);
      setShowConfirmDelete(false);
      // O baralho some na hora: o aviso vai para o anúncio global e a lista abre já
      announce("Baralho excluído.");
      router.push(routes.decks);
    } catch (error) {
      setShowConfirmDelete(false);
      setStatusMessage(errorMessage(error, "Não foi possível excluir o baralho. Tente novamente."));
    }
  };

  const openEditCardModal = (card: CardResponse, index: number) => {
    setEditingCard({ card, index });
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setQuestionError("");
    setAnswerError("");
    setCardFormError("");
  };

  const handleSaveCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !deck) return;
    const question = editQuestion.trim();
    const answer = editAnswer.trim();
    setQuestionError(question ? "" : "Escreva a pergunta.");
    setAnswerError(answer ? "" : "Escreva a resposta.");
    // O foco vai para o primeiro campo com problema
    if (!question) return questionRef.current?.focus();
    if (!answer) return answerRef.current?.focus();

    try {
      editCard(deck.id, editingCard.card.id, { question, answer });
      setStatusMessage(`Ficha ${editingCard.index + 1} de “${deck.title}” atualizada.`);
      setEditingCard(null);
    } catch (err) {
      setCardFormError(errorMessage(err, "Não foi possível salvar a ficha. Tente novamente."));
    }
  };

  const handleConfirmDeleteCard = () => {
    if (!deletingCard || !deck) return;
    try {
      deleteCard(deck.id, deletingCard.card.id);
      setStatusMessage(`Ficha ${deletingCard.index + 1} excluída de “${deck.title}”.`);
    } catch (err) {
      setStatusMessage(errorMessage(err, "Não foi possível excluir a ficha. Tente novamente."));
    }
    setDeletingCard(null);
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
  // Mantém o número original da ficha mesmo filtrando
  const visibleCards = filterCards(
    cardList.map((card, index) => ({ card, index, question: card.question, answer: card.answer })),
    query
  );

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
          {(deck.questionLang || deck.answerLang) && (
            <p className={styles.meta}>
              Perguntas em {languageName(deck.questionLang).toLowerCase()} · respostas em{" "}
              {languageName(deck.answerLang).toLowerCase()}
            </p>
          )}
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
        {/* A quantidade vem antes da lista: dá para decidir se percorre ou pula */}
        <h2 id="cards-list-heading" className={styles.sectionTitle}>
          Fichas ({cardList.length})
        </h2>

        {cardList.length > 1 && (
          <div className={styles.search}>
            <Input
              id="buscar-fichas"
              type="search"
              label="Buscar fichas"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {/* O texto muda a cada busca, então o leitor de tela anuncia de novo */}
            <p role="status" className={query.trim() ? styles.searchStatus : "sr-only"}>
              {query.trim() ? resultsText(visibleCards.length, query) : ""}
            </p>
          </div>
        )}

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
            {visibleCards.map(({ card, index }) => (
              <li key={card.id || index} className={styles.cardItem}>
                <span className={styles.cardNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <div className={styles.cardContent}>
                  {/* Pergunta e resposta no mesmo parágrafo: lidas de uma vez */}
                  <p className={styles.cardText}>
                    <span className={styles.questionText}>
                      <span className="sr-only">Pergunta {index + 1}: </span>
                      {/* lang: o leitor de tela troca a voz no idioma do baralho */}
                      <span lang={langAttr(deck.questionLang)}>{card.question}</span>
                    </span>
                    <span className="sr-only">. </span>
                    <br />
                    <span className={styles.answerText}>
                      <span className="sr-only">Resposta: </span>
                      <span lang={langAttr(deck.answerLang)}>{card.answer}</span>
                    </span>
                  </p>
                  <div className={styles.cardActions}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditCardModal(card, index)}
                      aria-label={`Editar ficha ${index + 1}: ${shortQuestion(card.question)}`}
                    >
                      <Pencil aria-hidden="true" />
                      <span>Editar</span>
                    </Button>

                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeletingCard({ card, index })}
                      aria-label={`Excluir ficha ${index + 1}: ${shortQuestion(card.question)}`}
                    >
                      <Trash2 aria-hidden="true" />
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
        <Button variant="soft" size="md" onClick={openLanguageModal} aria-haspopup="dialog">
          <Languages aria-hidden="true" />
          <span>Idioma das fichas</span>
        </Button>
        {/* Baralho só do aparelho, com a conta aberta: dá para levar depois do "Agora não" */}
        {deck.kind === "aparelho" && authStatus === "logado" && (
          <Button variant="soft" size="md" onClick={() => requestTransfer([deck.id])}>
            <Upload aria-hidden="true" />
            <span>Levar para a conta</span>
          </Button>
        )}
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
            setRenameError("");
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
        onClose={() => setShowConfirmDelete(false)}
        title="Excluir este baralho?"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowConfirmDelete(false)}>
              Cancelar
            </Button>
            <Button variant="danger" size="md" onClick={handleDelete}>
              Sim, excluir
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
        onClose={() => setShowRenameModal(false)}
        title="Renomear baralho"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowRenameModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-renomear" variant="primary" size="md">
              Salvar
            </Button>
          </>
        }
      >
        <form id="form-renomear" onSubmit={handleRename} noValidate>
          <Input
            ref={renameRef}
            id="rename-deck-input"
            label="Novo nome do baralho"
            value={renameTitle}
            error={renameError}
            onChange={(e) => {
              setRenameTitle(e.target.value);
              if (renameError) setRenameError("");
            }}
            maxLength={200}
            autoComplete="off"
          />
        </form>
      </Dialog>

      <Dialog
        open={Boolean(editingCard)}
        onClose={() => setEditingCard(null)}
        title={editingCard ? `Editar ficha ${editingCard.index + 1}` : "Editar ficha"}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setEditingCard(null)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-editar-ficha" variant="primary" size="md">
              Salvar
            </Button>
          </>
        }
      >
        <form id="form-editar-ficha" onSubmit={handleSaveCard} className={styles.editForm} noValidate>
          <Textarea
            ref={questionRef}
            id="edit-card-question"
            label="Pergunta"
            rows={3}
            value={editQuestion}
            error={questionError}
            onChange={(e) => {
              setEditQuestion(e.target.value);
              if (questionError) setQuestionError("");
            }}
          />
          <Textarea
            ref={answerRef}
            id="edit-card-answer"
            label="Resposta"
            rows={3}
            value={editAnswer}
            error={answerError}
            onChange={(e) => {
              setEditAnswer(e.target.value);
              if (answerError) setAnswerError("");
            }}
          />
          {cardFormError && (
            <p role="alert" className={styles.formError}>
              {cardFormError}
            </p>
          )}
        </form>
      </Dialog>

      <Dialog
        open={Boolean(deletingCard)}
        onClose={() => setDeletingCard(null)}
        title={deletingCard ? `Excluir a ficha ${deletingCard.index + 1}?` : "Excluir ficha?"}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setDeletingCard(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="md" onClick={handleConfirmDeleteCard}>
              Sim, excluir
            </Button>
          </>
        }
      >
        <p>
          A ficha <strong>“{deletingCard?.card.question}”</strong> será apagada. Não dá
          para desfazer.
        </p>
      </Dialog>

      <Dialog
        open={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        title="Idioma das fichas"
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setShowLanguageModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-idioma" variant="primary" size="md">
              Salvar
            </Button>
          </>
        }
      >
        <form id="form-idioma" onSubmit={handleSaveLanguages} className={styles.editForm}>
          <p>
            Num baralho de outro idioma, o leitor de tela troca a voz e pronuncia as
            palavras corretamente.
          </p>
          <Select
            id="idioma-perguntas"
            label="Idioma das perguntas"
            options={LANGUAGES}
            value={questionLang}
            onChange={(e) => setQuestionLang(e.target.value)}
          />
          <Select
            id="idioma-respostas"
            label="Idioma das respostas"
            options={LANGUAGES}
            value={answerLang}
            onChange={(e) => setAnswerLang(e.target.value)}
          />
        </form>
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
