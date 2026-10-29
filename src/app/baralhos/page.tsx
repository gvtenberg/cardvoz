"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DeckCard, DeckCardSkeleton, Button, Skeleton, LoadingStatus } from "@/components";
import { Plus, Upload } from "lucide-react";
import {
  copySharedDeck,
  errorMessage,
  getDecks,
  getSharedDecks,
  type DeckResponse,
} from "@/lib/api";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

export default function HomePage() {
  const [decks, setDecks] = useState<DeckResponse[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [shared, setShared] = useState<DeckResponse[] | null>(null);
  const [sharedError, setSharedError] = useState("");
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [status, setStatus] = useState({ message: "", isError: false });
  // O botão "Adicionar" some depois da cópia: o foco vai para o aviso que fica no lugar
  const focusAdded = useRef<string | null>(null);

  const loadDecks = useCallback(() => {
    setLoadError("");
    getDecks()
      .then(setDecks)
      .catch((error) =>
        setLoadError(errorMessage(error, "Não foi possível carregar seus baralhos. Tente de novo."))
      );
  }, []);

  const loadShared = useCallback(() => {
    setSharedError("");
    getSharedDecks()
      .then(setShared)
      .catch((error) =>
        setSharedError(errorMessage(error, "Não foi possível carregar os baralhos prontos. Tente de novo."))
      );
  }, []);

  useEffect(() => {
    loadDecks();
    loadShared();
  }, [loadDecks, loadShared]);

  useEffect(() => {
    if (focusAdded.current) {
      document.getElementById(focusAdded.current)?.focus();
      focusAdded.current = null;
    }
  }, [decks]);

  const handleCopy = async (deck: DeckResponse) => {
    if (copyingId) return;
    setCopyingId(deck.id);
    setStatus({ message: "", isError: false });
    try {
      const copy = await copySharedDeck(deck.id);
      focusAdded.current = `pronto-${deck.id}`;
      // A API lista os mais novos primeiro
      setDecks((current) => [copy, ...(current ?? [])]);
      setStatus({ message: `“${copy.title}” foi adicionado aos seus baralhos.`, isError: false });
    } catch (error) {
      setStatus({
        message: errorMessage(error, `Não foi possível adicionar “${deck.title}”. Tente de novo.`),
        isError: true,
      });
    } finally {
      setCopyingId(null);
    }
  };

  const totalCards = decks?.reduce((acc, d) => acc + (d.cardCount || 0), 0) ?? 0;

  return (
    <main id="main-content" tabIndex={-1} className={styles.main}>
      <header className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Seus baralhos</h1>
          {decks === null && !loadError && <Skeleton width="11rem" height="1.25rem" className={styles.subtitleSkeleton} />}
          {decks && decks.length > 0 && (
            <p className={styles.pageSubtitle}>
              {decks.length} {decks.length === 1 ? "baralho" : "baralhos"} ·{" "}
              {totalCards} {totalCards === 1 ? "ficha" : "fichas"}
            </p>
          )}
        </div>

        <div className={styles.headerActions}>
          <Button href={routes.newDeck} variant="primary" size="md">
            <Plus aria-hidden="true" />
            <span>Novo baralho</span>
          </Button>
          <Button href={routes.importDeck} variant="soft" size="md">
            <Upload aria-hidden="true" />
            <span>Importar arquivo</span>
          </Button>
        </div>
      </header>

      <p
        role="status"
        className={status.message ? (status.isError ? styles.statusError : styles.status) : "sr-only"}
      >
        {status.message}
      </p>

      {loadError ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Seus baralhos não carregaram</h2>
          <p role="alert" className={styles.emptyText}>
            {loadError}
          </p>
          <Button variant="primary" size="md" onClick={loadDecks}>
            Tentar de novo
          </Button>
        </div>
      ) : decks === null ? (
        <>
          <LoadingStatus>Carregando baralhos...</LoadingStatus>
          <ul className={styles.decksGrid} aria-hidden="true">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i}>
                <DeckCardSkeleton />
              </li>
            ))}
          </ul>
        </>
      ) : decks.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Você ainda não tem baralhos</h2>
          <p className={styles.emptyText}>
            Crie o primeiro baralho e escreva suas perguntas, ou importe um arquivo
            com fichas prontas.
          </p>
        </div>
      ) : (
        <ul className={styles.decksGrid} aria-label="Baralhos">
          {decks.map((deck) => (
            <li key={deck.id}>
              <DeckCard deck={deck} />
            </li>
          ))}
        </ul>
      )}

      {/* Carregando: só o anúncio, sem skeleton, porque a lista costuma vir vazia
          e um bloco que aparece e some faria a tela pular */}
      {decks !== null && shared === null && !sharedError && (
        <LoadingStatus>Carregando baralhos prontos...</LoadingStatus>
      )}

      {decks !== null && sharedError && (
        <section className={styles.shared} aria-labelledby="prontos-titulo">
          <h2 id="prontos-titulo" className={styles.sharedTitle}>
            Baralhos prontos
          </h2>
          <p role="alert" className={styles.statusError}>
            {sharedError}
          </p>
          <div>
            <Button variant="soft" size="md" onClick={loadShared}>
              Tentar de novo
            </Button>
          </div>
        </section>
      )}

      {/* Sem baralhos prontos a seção não aparece: é um complemento, não o conteúdo da página */}
      {decks !== null && shared !== null && shared.length > 0 && (
        <section className={styles.shared} aria-labelledby="prontos-titulo">
          <div>
            <h2 id="prontos-titulo" className={styles.sharedTitle}>
              Baralhos prontos
            </h2>
            <p className={styles.pageSubtitle}>
              Adicione uma cópia aos seus baralhos para estudar e editar.
            </p>
          </div>
          <ul className={styles.decksGrid}>
            {shared.map((deck) => {
              const added = decks.some((mine) => mine.sourceDeckId === deck.id);
              const label = copyingId === deck.id ? "Adicionando..." : "Adicionar aos meus baralhos";
              return (
                <li key={deck.id} className={styles.sharedCard}>
                  <div>
                    <h3 className={styles.sharedName}>{deck.title}</h3>
                    <p className={styles.sharedMeta}>
                      {deck.cardCount} {deck.cardCount === 1 ? "ficha" : "fichas"}
                    </p>
                    {deck.description && <p className={styles.sharedDescription}>{deck.description}</p>}
                  </div>
                  {added ? (
                    // Evita cópias repetidas; se a pessoa excluir a cópia, o botão volta
                    <p id={`pronto-${deck.id}`} tabIndex={-1} className={styles.sharedAdded}>
                      Já está nos seus baralhos.
                    </p>
                  ) : (
                    // aria-disabled em vez de disabled: botão desativado perde o foco
                    <Button
                      variant="soft"
                      size="md"
                      block
                      onClick={() => handleCopy(deck)}
                      aria-disabled={copyingId === deck.id || undefined}
                      aria-label={`${label}: ${deck.title}`}
                    >
                      <Plus aria-hidden="true" />
                      <span>{label}</span>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
