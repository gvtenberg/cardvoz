"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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
      setStatusMessage("Por favor, preencha a pergunta e a resposta da ficha.");
      return;
    }

    setStatusMessage("Ficha salva com sucesso no baralho!");
    setTimeout(() => {
      router.push(`/baralhos/${deckId}`);
    }, 800);
  };

  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Navegação estrutural" className={styles.navBar}>
        <Link href={`/baralhos/${deckId}`} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Voltar para o baralho</span>
        </Link>
      </nav>

      <section className={styles.formCard} aria-labelledby="form-heading">
        <div className={styles.header}>
          <h1 id="form-heading" className={styles.title}>
            Adicionar Nova Ficha
          </h1>
          <p className={styles.subtitle}>
            Insira o conteúdo da pergunta (frente da ficha) e da resposta (verso da ficha).
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
          <div className={styles.field}>
            <label htmlFor="pergunta" className={styles.label}>
              Frente da Ficha (Pergunta) <span className={styles.required}>*</span>
            </label>
            <textarea
              id="pergunta"
              name="pergunta"
              required
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Digite o enunciado da pergunta que será lido em voz alta..."
              className={styles.textarea}
              aria-required="true"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="resposta" className={styles.label}>
              Verso da Ficha (Resposta) <span className={styles.required}>*</span>
            </label>
            <textarea
              id="resposta"
              name="resposta"
              required
              rows={4}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Digite a resposta correta para conferência e confirmação..."
              className={styles.textarea}
              aria-required="true"
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.submitBtn}>
              Salvar ficha
            </button>
            <Link href={`/baralhos/${deckId}`} className={styles.cancelBtn}>
              Cancelar
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
