"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Textarea, Button, FileImport } from "@/components";
import { getDeck, createCard, createCards, type DeckDetailResponse } from "@/lib/api";
import type { ImportResult } from "@/lib/importCards";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

function NovoCartaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckIdOrSlug = searchParams.get("id") || "";
  const questionRef = useRef<HTMLTextAreaElement>(null);

  const [deck, setDeck] = useState<DeckDetailResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const [imported, setImported] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    if (deckIdOrSlug) {
      getDeck(deckIdOrSlug).then((data) => {
        if (data) setDeck(data);
      });
    }
  }, [deckIdOrSlug]);

  const targetSlug = deck?.slug || deckIdOrSlug;
  const nextOrder = (deck?.cards.length ?? 0) + savedCount + 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deck) return;
    if (!question.trim() || !answer.trim()) {
      setFormError("Preencha a pergunta e a resposta.");
      if (!question.trim()) questionRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setFormError("");
    try {
      await createCard({
        deckId: deck.id,
        question: question.trim(),
        answer: answer.trim(),
        displayOrder: nextOrder,
      });

      // Mantém a pessoa na página para escrever a próxima ficha
      // O número muda a cada ficha para o leitor de tela anunciar de novo
      setSavedCount(savedCount + 1);
      setQuestion("");
      setAnswer("");
      setStatusMessage(
        `${savedCount + 1}ª ficha salva. Escreva a próxima ou toque em Concluir.`
      );
      questionRef.current?.focus();
    } catch (error) {
      console.error(error);
      setStatusMessage("Não foi possível salvar a ficha. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImport = async () => {
    if (!imported || !deck) return;
    const total = imported.cards.length;
    setIsImporting(true);
    setProgress({ done: 0, total });
    setStatusMessage(`Importando ${total} fichas...`);

    const saved = await createCards(deck.id, imported.cards, {
      startOrder: nextOrder,
      onProgress: (done) => setProgress({ done, total }),
    });

    setStatusMessage(
      saved === total
        ? `${saved} fichas adicionadas ao baralho.`
        : `${saved} de ${total} fichas foram adicionadas.`
    );
    setTimeout(() => router.push(routes.deck(targetSlug)), 800);
  };

  const importCount = imported?.cards.length ?? 0;
  const busy = isSubmitting || isImporting;

  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Navegação estrutural">
        <Link href={routes.deck(targetSlug)} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>{deck ? deck.title : "Voltar ao baralho"}</span>
        </Link>
      </nav>

      <div>
        <h1 className={styles.title}>Adicionar fichas</h1>
        {deck && <p className={styles.subtitle}>Em {deck.title}</p>}
      </div>

      <p role="status" className={statusMessage ? styles.status : "sr-only"}>
        {statusMessage}
      </p>

      <form onSubmit={handleSubmit} className={styles.panel} noValidate>
        <Textarea
          ref={questionRef}
          id="pergunta"
          name="pergunta"
          label="Pergunta"
          required
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex.: Qual organela produz energia na célula?"
        />

        <Textarea
          id="resposta"
          name="resposta"
          label="Resposta"
          required
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Ex.: A mitocôndria."
        />

        {formError && (
          <p role="alert" className={styles.error}>
            {formError}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" block disabled={busy || !deck}>
            {isSubmitting ? "Salvando..." : "Salvar ficha"}
          </Button>
          <Button href={routes.deck(targetSlug)} variant="secondary" size="md" block>
            {savedCount > 0 ? "Concluir" : "Cancelar"}
          </Button>
        </div>
      </form>

      <section className={styles.panel} aria-labelledby="importar-titulo">
        <div>
          <h2 id="importar-titulo" className={styles.panelTitle}>
            Ou importe várias de um arquivo
          </h2>
          <p className={styles.panelText}>As fichas do arquivo entram no fim deste baralho.</p>
        </div>

        <FileImport value={imported} onChange={setImported} disabled={busy} />

        {importCount > 0 && (
          <Button
            variant="primary"
            size="lg"
            block
            onClick={handleImport}
            disabled={busy || !deck}
          >
            {progress
              ? `Importando ${progress.done} de ${progress.total}...`
              : `Adicionar ${importCount} ${importCount === 1 ? "ficha" : "fichas"}`}
          </Button>
        )}
      </section>
    </main>
  );
}

export default function NovoCartaoPage() {
  return (
    <Suspense>
      <NovoCartaoContent />
    </Suspense>
  );
}
