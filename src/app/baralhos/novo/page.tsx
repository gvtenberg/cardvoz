"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Input, Button, FileImport } from "@/components";
import { createDeck, createCards } from "@/lib/api";
import type { ImportResult } from "@/lib/importCards";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

export default function NovoBaralhoPage() {
  const router = useRouter();
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [imported, setImported] = useState<ImportResult | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const handleImport = (result: ImportResult | null) => {
    // Sugere o nome do arquivo se a pessoa ainda não digitou um nome
    if (result && !name.trim()) {
      setName(result.title);
      setNameError("");
    }
    setImported(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = name.trim();
    if (!title) {
      setNameError("Escreva um nome para o baralho.");
      nameRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setNameError("");
    try {
      const created = await createDeck({ title, category: "Geral" });

      if (imported && imported.cards.length > 0) {
        const total = imported.cards.length;
        setStatusMessage(`Importando ${total} fichas...`);
        setProgress({ done: 0, total });
        const saved = await createCards(created.id, imported.cards, {
          onProgress: (done) => setProgress({ done, total }),
        });
        setStatusMessage(
          saved === total
            ? `Baralho criado com ${saved} fichas.`
            : `Baralho criado. ${saved} de ${total} fichas foram importadas.`
        );
      } else {
        setStatusMessage("Baralho criado.");
      }

      setTimeout(() => {
        router.push(routes.deck(created.slug || created.id));
      }, 800);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setProgress(null);
      setStatusMessage("Não foi possível salvar o baralho. Tente novamente.");
    }
  };

  const count = imported?.cards.length ?? 0;
  const submitLabel = progress
    ? `Importando ${progress.done} de ${progress.total}...`
    : isSubmitting
      ? "Salvando..."
      : count > 0
        ? `Criar baralho com ${count} ${count === 1 ? "ficha" : "fichas"}`
        : "Criar baralho";

  return (
    <main id="main-content" className={styles.main}>
      <nav aria-label="Navegação estrutural">
        <Link href={routes.decks} className={styles.backLink}>
          <ArrowLeft aria-hidden="true" />
          <span>Meus baralhos</span>
        </Link>
      </nav>

      <h1 className={styles.title}>Novo baralho</h1>

      <p role="status" className={statusMessage ? styles.status : "sr-only"}>
        {statusMessage}
      </p>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <div className={styles.panel}>
          <Input
            ref={nameRef}
            id="nome-baralho"
            name="nome-baralho"
            label="Nome do baralho"
            required
            value={name}
            error={nameError}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="Ex.: Farmacologia"
            autoComplete="off"
          />
        </div>

        <section id="importar" className={styles.panel} aria-labelledby="importar-titulo">
          <div>
            <h2 id="importar-titulo" className={styles.panelTitle}>
              Importar fichas de um arquivo
            </h2>
            <p className={styles.panelText}>Opcional. Você também pode escrever as fichas depois.</p>
          </div>
          <FileImport value={imported} onChange={handleImport} disabled={isSubmitting} />
        </section>

        <div className={styles.actions}>
          <Button type="submit" variant="primary" size="lg" block disabled={isSubmitting}>
            {submitLabel}
          </Button>
          <Button href={routes.decks} variant="ghost" size="md" block>
            Cancelar
          </Button>
        </div>
      </form>
    </main>
  );
}
