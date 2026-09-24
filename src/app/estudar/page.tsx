"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  Check,
  RotateCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Button, Badge, Kbd } from "@/components";
import {
  getDeck,
  startStudySession,
  recordStudyReview,
  finishStudySession,
  type CardResponse,
  type DeckDetailResponse,
  type StudySessionResponse,
} from "@/lib/api";
import styles from "./page.module.scss";

function EstudarLoading() {
  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Controles da sessão de estudo" className={styles.topNav}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Voltar aos baralhos</span>
        </Link>
      </nav>
      <div className={styles.finishedCard}>
        <p className={styles.finishedSubtitle}>Preparando sessão de estudo por voz...</p>
      </div>
    </main>
  );
}

function EstudarContent() {
  const searchParams = useSearchParams();
  const deckSlug = searchParams.get("deck") || "biologia-celular";

  const [deck, setDeck] = useState<DeckDetailResponse | null>(null);
  const [cards, setCards] = useState<CardResponse[]>([]);
  const [session, setSession] = useState<StudySessionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const currentCard: CardResponse | undefined = cards[currentIndex];

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Inicializa o baralho e abre a sessão na API C#
  const initSession = useCallback(async () => {
    setLoading(true);
    try {
      const loadedDeck = await getDeck(deckSlug);
      if (loadedDeck) {
        setDeck(loadedDeck);
        const deckCards = loadedDeck.cards || [];
        setCards(deckCards);

        if (deckCards.length > 0) {
          const newSession = await startStudySession({
            deckSlug: loadedDeck.slug,
            deckId: loadedDeck.id,
          });
          setSession(newSession);
        }
      }
    } catch (err) {
      console.error("Erro ao iniciar sessão de estudos:", err);
    } finally {
      setLoading(false);
    }
  }, [deckSlug]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Lê a pergunta em voz alta ao avançar de ficha
  useEffect(() => {
    if (!isFinished && currentCard && speechEnabled && !loading) {
      const msg = `Ficha ${currentIndex + 1} de ${cards.length}. Pergunta: ${currentCard.question}`;
      setAnnouncement(msg);
      speak(msg);
    }
  }, [currentIndex, isFinished, speechEnabled, currentCard, cards.length, loading, speak]);

  const handleReveal = useCallback(() => {
    if (!currentCard) return;
    setIsRevealed(true);
    const msg = `Resposta: ${currentCard.answer}. Pressione a tecla 1 para marcar acerto, ou tecla 2 para revisar.`;
    setAnnouncement(msg);
    if (speechEnabled) {
      speak(`Resposta: ${currentCard.answer}`);
    }
  }, [currentCard, speechEnabled, speak]);

  const handleAnswer = useCallback(
    async (wasCorrect: boolean) => {
      if (!currentCard) return;

      const newCorrect = wasCorrect ? correctCount + 1 : correctCount;
      const newIncorrect = wasCorrect ? incorrectCount : incorrectCount + 1;
      setCorrectCount(newCorrect);
      setIncorrectCount(newIncorrect);
      setAnnouncement(wasCorrect ? "Ficha marcada como acerto." : "Ficha marcada para revisão.");

      // Registra a revisão na API
      if (session) {
        try {
          await recordStudyReview(session.id, {
            cardId: currentCard.id,
            wasCorrect,
            voiceUsed: false,
          });
        } catch (err) {
          console.warn("Falha ao registrar revisão na API:", err);
        }
      }

      if (currentIndex + 1 < cards.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        // Finaliza sessão na API
        setIsFinished(true);
        let finalScore = cards.length > 0 ? Math.round((newCorrect / cards.length) * 100) : 0;

        if (session) {
          try {
            const finished = await finishStudySession(session.id);
            if (finished.scorePercentage !== undefined) {
              finalScore = Math.round(finished.scorePercentage);
            }
          } catch (err) {
            console.warn("Falha ao finalizar sessão na API:", err);
          }
        }

        setScorePercentage(finalScore);
        const finishMsg = `Sessão finalizada. Você acertou ${newCorrect} de ${cards.length} fichas (${finalScore}% de aproveitamento).`;
        setAnnouncement(finishMsg);
        if (speechEnabled) {
          speak(finishMsg);
        }
      }
    },
    [currentCard, correctCount, incorrectCount, session, currentIndex, cards.length, speechEnabled, speak]
  );

  const restartSession = async () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setScorePercentage(0);
    setIsFinished(false);
    setAnnouncement("Sessão reiniciada na primeira ficha.");

    if (deck) {
      try {
        const newSession = await startStudySession({
          deckSlug: deck.slug,
          deckId: deck.id,
        });
        setSession(newSession);
      } catch (err) {
        console.warn("Falha ao criar nova sessão:", err);
      }
    }
  };

  // Escuta atalhos de teclado (Espaço, 1, 2, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (!isRevealed && !isFinished) {
          handleReveal();
        }
      } else if (e.key === "1") {
        e.preventDefault();
        if (isRevealed && !isFinished) {
          handleAnswer(true);
        }
      } else if (e.key === "2") {
        e.preventDefault();
        if (isRevealed && !isFinished) {
          handleAnswer(false);
        }
      } else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (currentCard) {
          if (!isRevealed) {
            speak(`Pergunta: ${currentCard.question}`);
          } else {
            speak(`Resposta: ${currentCard.answer}`);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRevealed, isFinished, currentCard, speak, handleReveal, handleAnswer]);

  if (loading) {
    return <EstudarLoading />;
  }

  if (!deck) {
    return (
      <main id="main-content" className={styles.main}>
        <nav aria-label="Controles da sessão de estudo" className={styles.topNav}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft aria-hidden="true" />
            <span>Voltar aos baralhos</span>
          </Link>
        </nav>
        <div className={styles.finishedCard}>
          <AlertCircle style={{ width: "2rem", height: "2rem", color: "var(--destructive)" }} aria-hidden="true" />
          <h1 className={styles.finishedTitle}>Baralho não encontrado</h1>
          <p className={styles.finishedSubtitle}>
            Não foi possível carregar as fichas para o baralho solicitado.
          </p>
          <Button href="/" variant="secondary">
            Voltar aos baralhos
          </Button>
        </div>
      </main>
    );
  }

  if (cards.length === 0) {
    return (
      <main id="main-content" className={styles.main}>
        <nav aria-label="Controles da sessão de estudo" className={styles.topNav}>
          <Link href={`/baralhos/${deck.slug || deck.id}`} className={styles.backLink}>
            <ArrowLeft aria-hidden="true" />
            <span>Voltar para {deck.title}</span>
          </Link>
        </nav>
        <div className={styles.finishedCard}>
          <h1 className={styles.finishedTitle}>Este baralho ainda não tem fichas</h1>
          <p className={styles.finishedSubtitle}>
            Cadastre pelo menos uma pergunta e resposta no baralho <strong>{deck.title}</strong> para praticar.
          </p>
          <div className={styles.finishedActions}>
            <Button href={`/baralhos/${deck.slug || deck.id}/novo-cartao`} variant="primary">
              <Plus aria-hidden="true" />
              <span>Adicionar ficha</span>
            </Button>
            <Button href="/" variant="secondary">
              Voltar aos baralhos
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className={styles.main}>
      {/* Live Region for Screen Readers */}
      <div aria-live="assertive" role="status" className="sr-only">
        {announcement}
      </div>

      {/* Top Study Bar */}
      <nav aria-label="Controles da sessão de estudo" className={styles.topNav}>
        <Link href={`/baralhos/${deck.slug || deck.id}`} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Encerrar sessão</span>
        </Link>

        <div className={styles.topRightControls}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            aria-label={
              speechEnabled
                ? "Desativar leitura de áudio automática"
                : "Ativar leitura de áudio automática"
            }
          >
            {speechEnabled ? (
              <>
                <Volume2 aria-hidden="true" />
                <span>Áudio ativo</span>
              </>
            ) : (
              <>
                <VolumeX aria-hidden="true" />
                <span>Áudio mudo</span>
              </>
            )}
          </Button>
        </div>
      </nav>

      {/* Finished Summary */}
      {isFinished ? (
        <section aria-labelledby="finished-title" className={styles.finishedCard}>
          <div className={styles.finishedBadge} aria-hidden="true">
            <CheckCircle2 />
          </div>

          <h1 id="finished-title" className={styles.finishedTitle}>
            Sessão Concluída
          </h1>
          <p className={styles.finishedSubtitle}>
            Você revisou todas as {cards.length} fichas do baralho <strong>{deck.title}</strong>.
          </p>

          <div className={styles.scoreRow}>
            <div className={styles.scoreItemCorrect}>
              <span className={styles.scoreNumber}>{correctCount}</span>
              <span className={styles.scoreLabel}>Acertos</span>
            </div>
            <div className={styles.scoreDivider} aria-hidden="true" />
            <div className={styles.scoreItemIncorrect}>
              <span className={styles.scoreNumber}>{incorrectCount}</span>
              <span className={styles.scoreLabel}>Para revisar</span>
            </div>
            <div className={styles.scoreDivider} aria-hidden="true" />
            <div className={styles.scoreItemCorrect}>
              <span className={styles.scoreNumber}>{scorePercentage}%</span>
              <span className={styles.scoreLabel}>Aproveitamento</span>
            </div>
          </div>

          <div className={styles.finishedActions}>
            <Button variant="primary" size="md" onClick={restartSession}>
              <RotateCcw aria-hidden="true" />
              <span>Estudar novamente</span>
            </Button>
            <Button variant="secondary" size="md" href={`/baralhos/${deck.slug || deck.id}`}>
              <span>Ver baralho</span>
            </Button>
            <Button variant="secondary" size="md" href="/">
              <span>Todos os baralhos</span>
            </Button>
          </div>
        </section>
      ) : (
        /* Physical Flashcard Metaphor */
        <div className={styles.studyWorkspace}>
          <article
            className={styles.indexCard}
            aria-label={`Ficha de estudo ${currentIndex + 1} de ${cards.length}: ${deck.title}`}
          >
            {/* Index Card Tab / Header */}
            <div className={styles.cardHeader}>
              <div className={styles.deckInfo}>
                <Badge variant="category">{deck.category}</Badge>
                <span className={styles.deckName}>{deck.title}</span>
              </div>

              <div className={styles.counterGroup}>
                <span className={styles.cardCounter}>
                  Ficha <strong>{currentIndex + 1}</strong> de {cards.length}
                </span>
              </div>
            </div>

            {/* Question Face */}
            <div className={styles.cardBody}>
              <div className={styles.questionSection}>
                <div className={styles.sectionHeadingRow}>
                  <span className={styles.sectionLabel}>Pergunta</span>
                  <button
                    type="button"
                    onClick={() => speak(`Pergunta: ${currentCard?.question}`)}
                    className={styles.repeatButton}
                    aria-label="Repetir pergunta em voz alta"
                  >
                    <RotateCcw aria-hidden="true" />
                    <span>Ouvir novamente</span>
                    <Kbd size="sm">R</Kbd>
                  </button>
                </div>

                <p className={styles.questionText}>{currentCard?.question}</p>
                {currentCard?.voiceNotes && (
                  <p className={styles.sectionSubtitle} style={{ marginTop: "0.25rem" }}>
                    {currentCard.voiceNotes}
                  </p>
                )}
              </div>

              {/* Answer Face */}
              {isRevealed ? (
                <div className={styles.answerSection}>
                  <div className={styles.sectionHeadingRow}>
                    <span className={styles.answerLabel}>Resposta</span>
                    <button
                      type="button"
                      onClick={() => speak(`Resposta: ${currentCard?.answer}`)}
                      className={styles.repeatButton}
                      aria-label="Repetir resposta em voz alta"
                    >
                      <RotateCcw aria-hidden="true" />
                      <span>Ouvir resposta</span>
                    </button>
                  </div>

                  <p className={styles.answerText}>{currentCard?.answer}</p>
                </div>
              ) : null}
            </div>

            {/* Bottom Card Action Area */}
            <div className={styles.cardFooter}>
              {!isRevealed ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleReveal}
                  className={styles.revealBtn}
                  aria-label="Revelar a resposta desta ficha (barra de espaço)"
                >
                  <Eye aria-hidden="true" />
                  <span>Mostrar resposta</span>
                  <Kbd size="sm">Espaço</Kbd>
                </Button>
              ) : (
                <div className={styles.assessmentGrid}>
                  <Button
                    variant="success"
                    size="md"
                    onClick={() => handleAnswer(true)}
                    className={styles.correctBtn}
                    aria-label="Marcar que acertei esta ficha (tecla 1)"
                  >
                    <Check aria-hidden="true" />
                    <span>Acertei</span>
                    <Kbd size="sm">1</Kbd>
                  </Button>

                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => handleAnswer(false)}
                    className={styles.reviewBtn}
                    aria-label="Marcar para revisar novamente depois (tecla 2)"
                  >
                    <RotateCw aria-hidden="true" />
                    <span>Revisar</span>
                    <Kbd size="sm">2</Kbd>
                  </Button>
                </div>
              )}
            </div>
          </article>

          {/* Clean Keyboard Shortcuts Strip */}
          <footer
            className={styles.shortcutsStrip}
            aria-label="Atalhos de teclado disponíveis"
          >
            <span className={styles.shortcutsLabel}>Atalhos:</span>
            <div className={styles.shortcutsList}>
              <span className={styles.shortcutItem}>
                <Kbd size="sm">Espaço</Kbd> <span>virar</span>
              </span>
              <span className={styles.shortcutSeparator} aria-hidden="true">
                &bull;
              </span>
              <span className={styles.shortcutItem}>
                <Kbd size="sm">1</Kbd> <span>acertei</span>
              </span>
              <span className={styles.shortcutSeparator} aria-hidden="true">
                &bull;
              </span>
              <span className={styles.shortcutItem}>
                <Kbd size="sm">2</Kbd> <span>revisar</span>
              </span>
              <span className={styles.shortcutSeparator} aria-hidden="true">
                &bull;
              </span>
              <span className={styles.shortcutItem}>
                <Kbd size="sm">R</Kbd> <span>repetir áudio</span>
              </span>
            </div>
          </footer>
        </div>
      )}
    </main>
  );
}

export default function EstudarPage() {
  return (
    <Suspense fallback={<EstudarLoading />}>
      <EstudarContent />
    </Suspense>
  );
}
