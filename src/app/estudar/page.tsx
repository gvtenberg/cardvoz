"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Volume2,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Award,
  Sparkles,
  VolumeX,
} from "lucide-react";
import styles from "./page.module.scss";

interface Card {
  id: number;
  question: string;
  answer: string;
}

const SAMPLE_DECK = {
  id: "biologia-celular",
  title: "Biologia Celular",
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
      const msg = `Pergunta número ${currentIndex + 1} de ${SAMPLE_DECK.cards.length}: ${currentCard.question}`;
      setAnnouncement(msg);
      speak(msg);
    }
  }, [currentIndex, isFinished, speechEnabled, currentCard, speak]);

  const handleReveal = useCallback(() => {
    setIsRevealed(true);
    const msg = `Resposta: ${currentCard?.answer}. Pressione tecla 1 para marcar que acertou, ou tecla 2 para marcar que errou.`;
    setAnnouncement(msg);
    if (speechEnabled && currentCard) {
      speak(`Resposta: ${currentCard.answer}`);
    }
  }, [currentCard, speechEnabled, speak]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (correct) {
        setCorrectCount((prev) => prev + 1);
        setAnnouncement("Cartão marcado como acerto.");
      } else {
        setIncorrectCount((prev) => prev + 1);
        setAnnouncement("Cartão marcado para revisão futura.");
      }

      if (currentIndex + 1 < SAMPLE_DECK.cards.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setIsFinished(true);
        const finishMsg = `Sessão finalizada! Você acertou ${correct ? correctCount + 1 : correctCount} de ${SAMPLE_DECK.cards.length} cartões.`;
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
    setAnnouncement("Sessão reiniciada.");
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

      <nav aria-label="Navegação da sessão" className={styles.topNav}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Encerrar sessão e voltar</span>
        </Link>

        <button
          type="button"
          onClick={() => setSpeechEnabled(!speechEnabled)}
          className={styles.audioToggle}
          aria-label={speechEnabled ? "Desativar leitura de áudio automática" : "Ativar leitura de áudio automática"}
        >
          {speechEnabled ? (
            <>
              <Volume2 aria-hidden="true" />
              <span>Áudio: Ativado</span>
            </>
          ) : (
            <>
              <VolumeX aria-hidden="true" />
              <span>Áudio: Silenciado</span>
            </>
          )}
        </button>
      </nav>

      {/* Finished Summary */}
      {isFinished ? (
        <div className={styles.finishedCard}>
          <div className={styles.finishedIcon}>
            <Award aria-hidden="true" />
          </div>

          <h1 className={styles.finishedTitle}>
            Sessão Concluída!
          </h1>
          <p className={styles.finishedSubtitle}>
            Parabéns! Você revisou todos os cartões de <strong>{SAMPLE_DECK.title}</strong>.
          </p>

          <div className={styles.scoreGrid}>
            <div className={styles.scoreBoxCorrect}>
              <span className={styles.scoreNum} style={{ color: "var(--success)" }}>
                {correctCount}
              </span>
              <span className={styles.scoreLabel}>
                Acertos
              </span>
            </div>
            <div className={styles.scoreBoxIncorrect}>
              <span className={styles.scoreNum} style={{ color: "var(--destructive)" }}>
                {incorrectCount}
              </span>
              <span className={styles.scoreLabel}>
                Revisar
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
            <button
              type="button"
              onClick={restartSession}
              style={{
                backgroundColor: "var(--primary)",
                color: "var(--primary-fg)",
                padding: "0.85rem 1.5rem",
                borderRadius: "0.75rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
              }}
            >
              <RotateCcw style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
              <span>Estudar novamente</span>
            </button>
            <Link
              href="/"
              style={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
                padding: "0.85rem 1.5rem",
                borderRadius: "0.75rem",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Voltar ao Início
            </Link>
          </div>
        </div>
      ) : (
        /* Active Study Card */
        <div>
          <div className={styles.sessionCard}>
            <div>
              <div className={styles.headerRow}>
                <div>
                  <span className={styles.sessionTag}>
                    Sessão Ativa
                  </span>
                  <h1 className={styles.deckTitle}>
                    Estudando: {SAMPLE_DECK.title}
                  </h1>
                </div>

                <div className={styles.progressContainer}>
                  <span className={styles.progressText}>
                    {currentIndex + 1} de {SAMPLE_DECK.cards.length}
                  </span>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{
                        width: `${((currentIndex + 1) / SAMPLE_DECK.cards.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className={styles.questionHeader}>
                  <h2 className={styles.label}>
                    Pergunta
                  </h2>
                  <button
                    type="button"
                    onClick={() => speak(`Pergunta: ${currentCard?.question}`)}
                    className={styles.repeatButton}
                    aria-label="Repetir pergunta por áudio"
                  >
                    <RotateCcw aria-hidden="true" />
                    <span>Ouvir novamente (R)</span>
                  </button>
                </div>

                <p className={styles.questionText}>
                  {currentCard?.question}
                </p>
              </div>
            </div>

            {/* Answer Section */}
            <div className={styles.answerSection}>
              {isRevealed ? (
                <div className={styles.answerBox}>
                  <div className={styles.questionHeader}>
                    <h2 className={styles.label} style={{ color: "var(--primary)" }}>
                      Resposta
                    </h2>
                    <button
                      type="button"
                      onClick={() => speak(`Resposta: ${currentCard?.answer}`)}
                      className={styles.repeatButton}
                      aria-label="Repetir resposta por áudio"
                    >
                      <RotateCcw aria-hidden="true" />
                      <span>Repetir resposta</span>
                    </button>
                  </div>
                  <p className={styles.answerText}>
                    {currentCard?.answer}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleReveal}
                  className={styles.revealButton}
                >
                  <Eye aria-hidden="true" />
                  <span>Revelar Resposta (ou tecle Espaço)</span>
                </button>
              )}
            </div>
          </div>

          {/* Action buttons (Acertei / Errei) */}
          {isRevealed && (
            <div className={styles.buttonGrid}>
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className={styles.btnCorrect}
                aria-label="Marcar que acertei e passar para o próximo cartão"
              >
                <CheckCircle2 aria-hidden="true" />
                <span>Acertei (Tecla 1)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className={styles.btnIncorrect}
                aria-label="Marcar que errei para revisar novamente depois"
              >
                <XCircle aria-hidden="true" />
                <span>Errei / Revisar (Tecla 2)</span>
              </button>
            </div>
          )}

          {/* Accessibility & Voice hints footer */}
          <div className={styles.shortcutsFooter}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 600 }}>
              <Sparkles style={{ width: "1rem", height: "1rem", color: "var(--primary)" }} aria-hidden="true" />
              Atalhos de teclado ativos:
            </span>
            <span className={styles.shortcutsList}>
              [Espaço] Revelar &bull; [1] Acertei &bull; [2] Errei &bull; [R] Ouvir áudio
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
