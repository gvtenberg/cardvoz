"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input, Textarea, Button } from "@/components";
import { createDeck } from "@/lib/api";
import styles from "./page.module.scss";

export default function NovoBaralhoPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Geral");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage("Por favor, insira o nome do baralho.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createDeck({
        title: name.trim(),
        category: category.trim() || "Geral",
        description: description.trim() || undefined,
      });

      setStatusMessage("Baralho criado com sucesso! Redirecionando...");
      setTimeout(() => {
        router.push(`/baralhos/${created.slug || created.id}`);
      }, 600);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setStatusMessage("Erro ao salvar baralho. Tente novamente.");
    }
  };

  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Navegação estrutural" className={styles.navBar}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Voltar para meus baralhos</span>
        </Link>
      </nav>

      <section className={styles.formCard} aria-labelledby="form-heading">
        <div className={styles.header}>
          <h1 id="form-heading" className={styles.title}>
            Criar Novo Baralho
          </h1>
          <p className={styles.subtitle}>
            Organize suas fichas de estudo por matéria ou tópico específico.
          </p>
        </div>

        {/* Live region for screen readers */}
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
          <Input
            id="nome-baralho"
            name="nome-baralho"
            label="Nome do Baralho"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Farmacologia Básica"
          />

          <Input
            id="categoria-baralho"
            name="categoria-baralho"
            label="Categoria ou Matéria"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: Medicina, Idiomas, História"
          />

          <Textarea
            id="descricao-baralho"
            name="descricao-baralho"
            label="Descrição da Coleção"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Breve resumo dos conceitos e tópicos abordados nestas fichas..."
          />

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar baralho"}
            </Button>
            <Button href="/" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}
