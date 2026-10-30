"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Eye, PartyPopper, Plus, RotateCcw, X } from "lucide-react";
import { Button, Skeleton, LoadingStatus } from "@/components";
import type { CardResponse } from "@/lib/api";
import { saveStudyResult, useDeck } from "@/lib/data";
import { markFirstStudyDone } from "@/lib/install";
import { routes } from "@/lib/routes";
import { useShortcutsEnabled } from "@/lib/shortcuts";
import styles from "./page.module.scss";

const ACTION_LOCK_MS = 400;

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={styles.backLink}>
      <ArrowLeft aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

function EstudarLoading() {
  return (
    <main id="main-content" className={`${styles.main} ${styles.studyMain}`}>
      <div className={styles.topBar}>
        <BackLink href={routes.decks} label="Sair" />
        <Skeleton width="5.5rem" height="2.875rem" radius="9999px" />
      </div>
      <LoadingStatus>Preparando as fichas...</LoadingStatus>

      <div className={styles.progressTrack} aria-hidden="true" />

      <div className={styles.studyCard} aria-hidden="true">
        <Skeleton width="45%" height="1.25rem" />
        <div className={styles.skeletonLines}>
          <Skeleton width="6rem" height="1rem" />
          <Skeleton width="95%" height="2.25rem" />
          <Skeleton width="70%" height="2.25rem" />
        </div>
      </div>

      <div className={styles.actionBar} aria-hidden="true">
        <div className={styles.actionGrid}>
          <Skeleton radius="1.5rem" className={styles.skeletonAction} />
          <Skeleton radius="1.5rem" className={styles.skeletonAction} />
        </div>
      </div>
    </main>
  );
}

/** Ignora atalhos quando o foco está num controle que já usa Espaço/teclas. */
function isInteractiveTarget(el: Element | null): boolean {
  return Boolean(
    el?.closest('button, a, input, textarea, select, summary, dialog, [contenteditable="true"]')
  );
}

function EstudarContent() {
  const searchParams = useSearchParams();
  const deckSlug = searchParams.get("deck") || "";

  // O baralho vem do aparelho; as fichas da rodada são fixadas ao começar, para
  // uma atualização vinda da conta não mudar as fichas no meio do estudo
  const { deck, loading, error: loadError } = useDeck(deckSlug);
  const [cards, setCards] = useState<CardResponse[] | null>(null);
  const shortcutsEnabled = useShortcutsEnabled();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [scorePercentage, setScorePercentage] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questionRef = useRef<HTMLHeadingElement>(null);
  const answerRef = useRef<HTMLHeadingElement>(null);
  const finishedRef = useRef<HTMLHeadingElement>(null);
  // Evita registrar a mesma ficha duas vezes num toque duplo
  const answeredIndexRef = useRef<number | null>(null);
  // Trava curta após cada ação: um toque duplo em "Ver resposta" não vira "Errei"
  // e um toque duplo em "Acertei" não pula a ficha seguinte sem ser vista
  const lockUntilRef = useRef(0);
  // Respostas da rodada: vão juntas para o histórico no fim (fila da conta)
  const startedAtRef = useRef(new Date().toISOString());
  const answersRef = useRef<{ cardId: string; wasCorrect: boolean; answeredAt: string }[]>([]);

  useEffect(() => {
    if (deck && cards === null) setCards(deck.cards || []);
  }, [deck, cards]);

  const roundCards = cards ?? [];
  const currentCard: CardResponse | undefined = roundCards[currentIndex];

  const acquireLock = useCallback(() => {
    const now = Date.now();
    if (now < lockUntilRef.current) return false;
    lockUntilRef.current = now + ACTION_LOCK_MS;
    return true;
  }, []);

  // Leva o foco para a pergunta a cada nova ficha: o leitor de tela lê sozinho
  useEffect(() => {
    if (cards !== null && !isFinished) {
      questionRef.current?.focus();
    }
  }, [currentIndex, cards, isFinished]);

  useEffect(() => {
    if (isRevealed) {
      answerRef.current?.focus();
    }
  }, [isRevealed]);

  useEffect(() => {
    if (isFinished) {
      finishedRef.current?.focus();
    }
  }, [isFinished]);

  const handleReveal = useCallback(() => {
    if (!currentCard || isFinished || isRevealed || !acquireLock()) return;
    setIsRevealed(true);
  }, [currentCard, isFinished, isRevealed, acquireLock]);

  const handleAnswer = useCallback(
    (wasCorrect: boolean) => {
      if (!currentCard || isFinished) return;
      if (answeredIndexRef.current === currentIndex || !acquireLock()) return;
      answeredIndexRef.current = currentIndex;

      const newCorrect = wasCorrect ? correctCount + 1 : correctCount;
      setCorrectCount(newCorrect);
      if (!wasCorrect) setIncorrectCount((n) => n + 1);

      answersRef.current.push({ cardId: currentCard.id, wasCorrect, answeredAt: new Date().toISOString() });

      if (currentIndex + 1 < roundCards.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
        return;
      }

      const localScore = roundCards.length > 0 ? Math.round((newCorrect / roundCards.length) * 100) : 0;
      setScorePercentage(localScore);
      setIsFinished(true);
      // A sugestão de instalar só aparece depois que a pessoa viu o CardVoz funcionar
      markFirstStudyDone();

      // Baralho da conta: o resultado entra na fila (vai para o histórico com internet)
      if (deck) {
        try {
          saveStudyResult(deck.id, { startedAt: startedAtRef.current, answers: answersRef.current });
        } catch {
          // Sem espaço no aparelho: o resumo continua na tela, só o histórico não é guardado
        }
      }
    },
    [currentCard, isFinished, currentIndex, correctCount, roundCards.length, deck, acquireLock]
  );

  const restartSession = () => {
    answeredIndexRef.current = null;
    answersRef.current = [];
    startedAtRef.current = new Date().toISOString();
    // Começa a nova rodada com as fichas atuais do baralho
    if (deck) setCards(deck.cards || []);
    setCurrentIndex(0);
    setIsRevealed(false);
    setCorrectCount(0);
    setIncorrectCount(0);
    setScorePercentage(0);
    setIsFinished(false);
  };

  // Atalhos: Espaço (ver resposta), 1 (acertei), 2 (errei). Só quando a pessoa
  // os liga na Ajuda (ver lib/shortcuts.ts)
  useEffect(() => {
    if (!shortcutsEnabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (isFinished || isInteractiveTarget(document.activeElement)) return;

      if (e.key === " " && !isRevealed) {
        e.preventDefault();
        handleReveal();
      } else if (e.key === "1") {
        e.preventDefault();
        handleAnswer(true);
      } else if (e.key === "2" && isRevealed) {
        e.preventDefault();
        handleAnswer(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcutsEnabled, isRevealed, isFinished, handleReveal, handleAnswer]);

  if (loading || (deck && cards === null)) {
    return <EstudarLoading />;
  }

  if (loadError) {
    return (
      <main id="main-content" className={styles.main}>
        <BackLink href={routes.decks} label="Meus baralhos" />
        <section className={styles.messageCard}>
          <h1 className={styles.messageTitle}>As fichas não carregaram</h1>
          <p role="alert" className={styles.messageText}>
            {loadError}
          </p>
          <Button variant="primary" size="lg" onClick={() => window.location.reload()}>
            Tentar de novo
          </Button>
        </section>
      </main>
    );
  }

  if (!deck) {
    return (
      <main id="main-content" className={styles.main}>
        <BackLink href={routes.decks} label="Meus baralhos" />
        <section className={styles.messageCard}>
          <h1 className={styles.messageTitle}>Baralho não encontrado</h1>
          <p className={styles.messageText}>
            Este baralho não existe mais ou o endereço está incorreto.
          </p>
          <Button href={routes.decks} variant="primary" size="lg">
            Voltar aos baralhos
          </Button>
        </section>
      </main>
    );
  }

  const deckHref = routes.deck(deck.slug || deck.id);

  if (roundCards.length === 0) {
    return (
      <main id="main-content" className={styles.main}>
        <BackLink href={deckHref} label={deck.title} />
        <section className={styles.messageCard}>
          <h1 className={styles.messageTitle}>Este baralho ainda não tem fichas</h1>
          <p className={styles.messageText}>
            Adicione pelo menos uma pergunta e resposta para começar a estudar.
          </p>
          <Button href={routes.addCards(deck.slug || deck.id)} variant="primary" size="lg">
            <Plus aria-hidden="true" />
            <span>Adicionar fichas</span>
          </Button>
        </section>
      </main>
    );
  }

  if (isFinished) {
    const total = roundCards.length;
    return (
      <main id="main-content" className={styles.main}>
        <BackLink href={deckHref} label={deck.title} />
        <section className={styles.messageCard} aria-labelledby="finished-title">
          <span className={styles.celebrate} aria-hidden="true">
            <PartyPopper />
          </span>
          <h1 id="finished-title" ref={finishedRef} tabIndex={-1} className={styles.messageTitle}>
            Sessão concluída!
            <span className="sr-only">
              {" "}
              Você acertou {correctCount} de {total} fichas, {scorePercentage}% de
              aproveitamento.
            </span>
          </h1>
          <p className={styles.messageText}>
            Você estudou {total === 1 ? "a ficha" : `as ${total} fichas`} de{" "}
            <strong>{deck.title}</strong>.
          </p>

          <ul className={styles.stats} aria-label="Resultado">
            <li className={styles.statCorrect}>
              <span className={styles.statNumber}>{correctCount}</span>
              <span className={styles.statLabel}>
                {correctCount === 1 ? "acerto" : "acertos"}
              </span>
            </li>
            <li className={styles.statIncorrect}>
              <span className={styles.statNumber}>{incorrectCount}</span>
              <span className={styles.statLabel}>
                {incorrectCount === 1 ? "erro" : "erros"}
              </span>
            </li>
            <li className={styles.statScore}>
              <span className={styles.statNumber}>{scorePercentage}%</span>
              <span className={styles.statLabel}>aproveitamento</span>
            </li>
          </ul>

          <div className={styles.finishedActions}>
            <Button variant="primary" size="lg" block onClick={restartSession}>
              <RotateCcw aria-hidden="true" />
              <span>Estudar de novo</span>
            </Button>
            <Button variant="secondary" size="md" block href={routes.decks}>
              Voltar aos baralhos
            </Button>
          </div>
        </section>
      </main>
    );
  }

  const position = currentIndex + 1;
  const progress = Math.round((position / roundCards.length) * 100);

  return (
    <main id="main-content" className={`${styles.main} ${styles.studyMain}`}>
      <div className={styles.topBar}>
        <BackLink href={deckHref} label="Sair" />
        <p className={styles.counter}>
          {position} de {roundCards.length}
        </p>
      </div>

      <div className={styles.progressTrack} aria-hidden="true">
        <span className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      <article className={styles.studyCard}>
        <h1 className={styles.deckTitle}>{deck.title}</h1>

        <h2 ref={questionRef} tabIndex={-1} className={styles.faceBlock}>
          <span className={styles.faceLabel}>
            Pergunta<span className="sr-only"> {position} de {roundCards.length}:</span>
          </span>
          <span className={styles.questionText}>{currentCard?.question}</span>
        </h2>

        {isRevealed && (
          <h2 ref={answerRef} tabIndex={-1} className={`${styles.faceBlock} ${styles.answerBlock}`}>
            <span className={styles.answerLabel}>
              Resposta<span className="sr-only">:</span>
            </span>
            <span className={styles.answerText}>{currentCard?.answer}</span>
          </h2>
        )}
      </article>

      {/* "Acertei" fica sempre no mesmo lugar (direita) para achar pelo toque */}
      <div className={styles.actionBar}>
        <div className={styles.actionGrid}>
          {isRevealed ? (
            <button
              key="wrong"
              type="button"
              className={`${styles.actionButton} ${styles.wrongButton}`}
              onClick={() => handleAnswer(false)}
            >
              <X aria-hidden="true" />
              <span>Errei</span>
            </button>
          ) : (
            <button
              key="reveal"
              type="button"
              className={`${styles.actionButton} ${styles.revealButton}`}
              onClick={handleReveal}
            >
              <Eye aria-hidden="true" />
              <span>Ver resposta</span>
            </button>
          )}
          <button
            type="button"
            className={`${styles.actionButton} ${styles.correctButton}`}
            onClick={() => handleAnswer(true)}
          >
            <Check aria-hidden="true" />
            <span>Acertei</span>
          </button>
        </div>
      </div>
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
