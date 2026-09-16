"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, PlusCircle, Sparkles } from "lucide-react";
import styles from "./page.module.scss";

export default function NovoCartaoPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = (params?.id as string) || "biologia-celular";

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setStatusMessage("Por favor, preencha a pergunta e a resposta do cartão.");
      return;
    }

    setStatusMessage("Cartão salvo com sucesso no baralho!");
    setTimeout(() => {
      router.push(`/baralhos/${deckId}`);
    }, 800);
  };

  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Navegação estrutural">
        <Link href={`/baralhos/${deckId}`} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Voltar para o baralho</span>
        </Link>
      </nav>

      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconCircle}>
            <PlusCircle aria-hidden="true" />
          </div>
          <div>
            <h1 className={styles.title}>
              Adicionar Novo Cartão
            </h1>
            <p className={styles.subtitle}>
              Insira a pergunta e a resposta correspondente para este cartão.
            </p>
          </div>
        </div>

        {/* Live region for screen reader alerts */}
        <div aria-live="polite" className="sr-only">
          {statusMessage}
        </div>

        {statusMessage && (
          <div role="alert" className={styles.alert}>
            <Sparkles style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            <span>{statusMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="pergunta" className={styles.label}>
              Pergunta <span className={styles.required}>*</span>
            </label>
            <textarea
              id="pergunta"
              name="pergunta"
              required
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Digite a pergunta que será falada durante o estudo..."
              className={styles.textarea}
              aria-required="true"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="resposta" className={styles.label}>
              Resposta <span className={styles.required}>*</span>
            </label>
            <textarea
              id="resposta"
              name="resposta"
              required
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Digite a resposta correta para conferência e leitura por voz..."
              className={styles.textarea}
              aria-required="true"
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.submitBtn}>
              Salvar Cartão
            </button>
            <Link href={`/baralhos/${deckId}`} className={styles.cancelBtn}>
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
