"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { FileCheck2, Upload } from "lucide-react";
import {
  IMPORT_ACCEPT,
  ImportError,
  readImportFile,
  type ImportResult,
} from "@/lib/importCards";
import { Button } from "../Button";
import styles from "./FileImport.module.scss";

const PREVIEW_COUNT = 3;

export interface FileImportProps {
  value: ImportResult | null;
  onChange: (result: ImportResult | null) => void;
  disabled?: boolean;
}

/** "12 fichas encontradas" ou, no arquivo de vários baralhos, "3 baralhos com 40 fichas" */
function foundText(result: ImportResult): string {
  const count = result.cards.length;
  const cards = `${count} ${count === 1 ? "ficha" : "fichas"}`;
  if (result.decks && result.decks.length > 1) {
    return `${result.decks.length} baralhos com ${cards}`;
  }
  return `${cards} ${count === 1 ? "encontrada" : "encontradas"}`;
}

/**
 * Seletor de arquivo TXT/CSV/JSON que lê as fichas e mostra uma prévia
 * antes de importar. A importação em si fica a cargo da página.
 */
export function FileImport({ value, onChange, disabled = false }: FileImportProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const focusInputRef = useRef(false);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!value && focusInputRef.current) {
      focusInputRef.current = false;
      inputRef.current?.focus();
    }
  }, [value]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      const result = await readImportFile(file);
      onChange(result);
      setAnnouncement(`${foundText(result)} no arquivo ${result.fileName}.`);
    } catch (err) {
      const message =
        err instanceof ImportError ? err.message : "Não foi possível ler este arquivo.";
      setError(message);
    }
  };

  const handleRemove = () => {
    focusInputRef.current = true;
    setAnnouncement("Arquivo removido.");
    onChange(null);
  };

  const count = value?.cards.length ?? 0;

  return (
    <div className={styles.wrapper}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMPORT_ACCEPT}
        className={`${styles.fileInput} ${value ? "" : "sr-only"}`}
        hidden={Boolean(value)}
        disabled={disabled}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          // Permite escolher o mesmo arquivo de novo
          e.target.value = "";
        }}
      />

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      {!value && (
        <label
          htmlFor={inputId}
          className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <span className={styles.dropIcon} aria-hidden="true">
            <Upload />
          </span>
          <span className={styles.dropTitle}>Escolher arquivo</span>
          <span className={styles.dropHint}>TXT, CSV ou JSON</span>
        </label>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {value ? (
        <div className={styles.summary}>
          <div className={styles.summaryHead}>
            <span className={styles.summaryIcon} aria-hidden="true">
              <FileCheck2 />
            </span>
            <div>
              <p className={styles.summaryTitle}>
                {foundText(value)}
              </p>
              <p className={styles.summaryMeta}>
                {value.fileName}
                {value.skipped > 0 &&
                  ` · ${value.skipped} ${value.skipped === 1 ? "linha ignorada" : "linhas ignoradas"}`}
              </p>
            </div>
          </div>

          <ol className={styles.preview} aria-label="Primeiras fichas do arquivo">
            {value.cards.slice(0, PREVIEW_COUNT).map((card, index) => (
              <li key={index} className={styles.previewItem}>
                <span className={styles.previewQuestion}>{card.question}</span>
                <span className={styles.previewAnswer}>{card.answer}</span>
              </li>
            ))}
          </ol>
          {count > PREVIEW_COUNT && (
            <p className={styles.more}>e mais {count - PREVIEW_COUNT}.</p>
          )}

          <div className={styles.summaryActions}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled}
            >
              Trocar arquivo
            </Button>
            <Button variant="ghost" size="sm" onClick={handleRemove} disabled={disabled}>
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <details className={styles.formatHelp}>
          <summary>Como montar o arquivo</summary>
          <div className={styles.formatBody}>
            <p>
              Uma ficha por linha, com pergunta e resposta separadas por ponto e
              vírgula:
            </p>
            <pre className={styles.example}>
              Capital do Brasil?; Brasília{"\n"}2 + 2?; 4
            </pre>
            <p>
              Planilhas salvas em CSV também funcionam (coluna A: pergunta,
              coluna B: resposta). Exemplos para baixar:{" "}
              <a href="/modelos/fichas-exemplo.txt" download>
                TXT
              </a>
              ,{" "}
              <a href="/modelos/fichas-exemplo.csv" download>
                CSV
              </a>{" "}
              e{" "}
              <a href="/modelos/fichas-exemplo.json" download>
                JSON
              </a>
              .
            </p>
          </div>
        </details>
      )}
    </div>
  );
}
