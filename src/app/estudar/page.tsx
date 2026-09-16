"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  Check,
  RotateCw,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { Button, Badge, Kbd } from "@/components";
import styles from "./page.module.scss";

interface Card {
  id: number;
  question: string;
  answer: string;
}

const SAMPLE_DECK = {
  id: "biologia-celular",
  title: "Biologia Celular",
  category: "Ciências Biológicas",
  cards: [
    {
      id: 1,
      question: "Qual organela celular é responsável pela produção de energia (ATP) por meio da respiração celular?",
      answer: "A mitocôndria.",
    },
    {
      id: 2,
      question: "Qual estrutura delimita a célula e controla a entrada e saída de substâncias?",
      answer: "A membrana plasmática (ou plasmalema).",
    },
    {
      id: 3,
      question: "Qual organela é responsável pela síntese de proteínas nas células?",
      answer: "Os ribossomos.",
    },
    {
      id: 4,
      question: "Qual organela realiza a fotossíntese nas células vegetais e algas?",
      answer: "Os cloroplastos.",
    },
  ],
};

export default function EstudarPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const currentCard: Card | undefined = SAMPLE_DECK.cards[currentIndex];

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Speak question when moving to new card
  useEffect(() => {
    if (!isFinished && currentCard && speechEnabled) {
      const msg = `Ficha ${currentIndex + 1} de ${SAMPLE_DECK.cards.length}. Pergunta: ${currentCard.question}`;
      setAnnouncement(msg);
      speak(msg);
    }
  }, [currentIndex, isFinished, speechEnabled, currentCard, speak]);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
    const msg = `Resposta: ${currentCard?.answer}. Pressione a tecla 1 para marcar acerto, ou tecla 2 para revisar.`;
    setAnnouncement(msg);
    if (speechEnabled && currentCard) {
      speak(`Resposta: ${currentCard.answer}`);
    }
  }, [currentCard, speechEnabled, speak]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (correct) {
        setCorrectCount((prev) => prev + 1);
        setAnnouncement("Ficha marcada como acerto.");
      } else {
        setIncorrectCount((prev) => prev + 1);
        setAnnouncement("Ficha marcada para revisão.");
      }

      if (currentIndex + 1 < SAMPLE_DECK.cards.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsFinished(true);
        const finishMsg = `Sessão finalizada. Você acertou ${correct ? correctCount + 1 : correctCount} de ${SAMPLE_DECK.cards.length} fichas.`;
        setAnnouncement(finishMsg);
        if (speechEnabled) {
          speak(finishMsg);
        }
      }
    },
    [currentIndex, correctCount, speechEnabled, speak]
  );

  const restartSession = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setIsFinished(false);
    setAnnouncement("Sessão reiniciada na primeira ficha.");
  };

  // Keyboard shortcut listener
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

  return (
    <main id="main-content" className={styles.main}>
      {/* Live Region for Screen Readers */}
      <div aria-live="assertive" role="status" className="sr-only">
        {announcement}
      </div>

      {/* Top Study Bar */}
      <nav aria-label="Controles da sessão de estudo" className={styles.topNav}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Encerrar sessão</span>
        </Link>

        <div className={styles.topRightControls}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            aria-label={speechEnabled ? "Desativar leitura de áudio automática" : "Ativar leitura de áudio automática"}
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
            Você revisou todas as {SAMPLE_DECK.cards.length} fichas do baralho <strong>{SAMPLE_DECK.title}</strong>.
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
          </div>

          <div className={styles.finishedActions}>
            <Button
              variant="primary"
              size="md"
              onClick={restartSession}
            >
              <RotateCcw aria-hidden="true" />
              <span>Estudar novamente</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              href="/"
            >
              <span>Voltar aos baralhos</span>
            </Button>
          </div>
        </section>
      ) : (
        /* Physical Flashcard Metaphor */
        <div className={styles.studyWorkspace}>
          <article
            className={styles.indexCard}
            aria-label={`Ficha de estudo ${currentIndex + 1} de ${SAMPLE_DECK.cards.length}: ${SAMPLE_DECK.title}`}
          >
            {/* Index Card Tab / Header */}
            <div className={styles.cardHeader}>
              <div className={styles.deckInfo}>
                <Badge variant="category">{SAMPLE_DECK.category}</Badge>
                <span className={styles.deckName}>{SAMPLE_DECK.title}</span>
              </div>

              <div className={styles.counterGroup}>
                <span className={styles.cardCounter}>
                  Ficha <strong>{currentIndex + 1}</strong> de {SAMPLE_DECK.cards.length}
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

                <p className={styles.questionText}>
                  {currentCard?.question}
                </p>
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

                  <p className={styles.answerText}>
                    {currentCard?.answer}
                  </p>
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
                  aria-label="Revelar a resposta desta ficha"
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
          <footer className={styles.shortcutsStrip} aria-label="Atalhos de teclado disponíveis">
            <span className={styles.shortcutsLabel}>Atalhos:</span>
            <div className={styles.shortcutsList}>
              <span className={styles.shortcutItem}>
                <Kbd size="sm">Espaço</Kbd> <span>virar</span>
              </span>
              <span className={styles.shortcutSeparator} aria-hidden="true">&bull;</span>
              <span className={styles.shortcutItem}>
                <Kbd size="sm">1</Kbd> <span>acertei</span>
              </span>
              <span className={styles.shortcutSeparator} aria-hidden="true">&bull;</span>
              <span className={styles.shortcutItem}>
                <Kbd size="sm">2</Kbd> <span>revisar</span>
              </span>
              <span className={styles.shortcutSeparator} aria-hidden="true">&bull;</span>
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
