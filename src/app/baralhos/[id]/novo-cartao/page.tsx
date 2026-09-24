"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Textarea, Input, Button } from "@/components";
import { getDeck, createCard, type DeckDetailResponse } from "@/lib/api";
import styles from "./page.module.scss";

export default function NovoCartaoPage() {
  const router = useRouter();
  const params = useParams();
  const deckIdOrSlug = (params?.id as string) || "biologia-celular";

  const [deck, setDeck] = useState<DeckDetailResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [voiceNotes, setVoiceNotes] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (deckIdOrSlug) {
      getDeck(deckIdOrSlug).then((data) => {
        if (data) setDeck(data);
      });
    }
  }, [deckIdOrSlug]);

  const targetSlug = deck?.slug || deckIdOrSlug;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setStatusMessage("Por favor, preencha a pergunta e a resposta da ficha.");
      return;
    }

    setIsSubmitting(true);
    try {
      const numericDeckId = deck?.id || 1;
      await createCard({
        deckId: numericDeckId,
        question: question.trim(),
        answer: answer.trim(),
        voiceNotes: voiceNotes.trim() || undefined,
      });

      setStatusMessage("Ficha salva com sucesso no baralho!");
      setTimeout(() => {
        router.push(`/baralhos/${targetSlug}`);
      }, 600);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setStatusMessage("Erro ao salvar a ficha. Tente novamente.");
    }
  };

  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Navegação estrutural" className={styles.navBar}>
        <Link href={`/baralhos/${targetSlug}`} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Voltar para o baralho {deck ? `(${deck.title})` : ""}</span>
        </Link>
      </nav>

      <section className={styles.formCard} aria-labelledby="form-heading">
        <div className={styles.header}>
          <h1 id="form-heading" className={styles.title}>
            Adicionar Nova Ficha
          </h1>
          <p className={styles.subtitle}>
            {deck
              ? `Adicionando ao baralho "${deck.title}". O conteúdo será lido em voz alta na sessão de estudo.`
              : "Insira o conteúdo da pergunta (frente da ficha) e da resposta (verso da ficha)."}
          </p>
        </div>

        {/* Live region for screen reader alerts */}
        <div aria-live="polite" className="sr-only">
          {statusMessage}
        </div>

        {statusMessage && (
          <div role="status" className={styles.alert}>
            <CheckCircle2 style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Textarea
            id="pergunta"
            name="pergunta"
            label="Frente da Ficha (Pergunta)"
            required
            rows={4}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Digite o enunciado da pergunta que será lido em voz alta..."
          />

          <Textarea
            id="resposta"
            name="resposta"
            label="Verso da Ficha (Resposta)"
            required
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Digite a resposta correta para conferência e confirmação..."
          />

          <Input
            id="voiceNotes"
            name="voiceNotes"
            label="Dica de Voz / Palavras-chave (Opcional)"
            value={voiceNotes}
            onChange={(e) => setVoiceNotes(e.target.value)}
            placeholder="Ex: Dica: respiração celular, mitocôndria"
          />

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvando ficha..." : "Salvar ficha"}
            </Button>
            <Button href={`/baralhos/${targetSlug}`} variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
