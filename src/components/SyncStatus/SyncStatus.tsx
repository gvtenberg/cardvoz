"use client";

import { useEffect, useState } from "react";
import { onSyncState, type SyncState } from "@/lib/data";
import styles from "./SyncStatus.module.scss";

/** Tempo que o aviso de "enviado" fica visível (o leitor de tela já anunciou) */
const SENT_VISIBLE_MS = 8000;

function pendingText(n: number) {
  return n === 1
    ? "Sem internet. 1 alteração será enviada quando você se conectar."
    : `Sem internet. ${n} alterações serão enviadas quando você se conectar.`;
}

/**
 * Aviso global da fila de alterações da conta, em role="status": aparece só
 * quando tem algo a dizer e não rouba o foco.
 */
export function SyncStatus() {
  const [state, setState] = useState<SyncState | null>(null);
  const [showSent, setShowSent] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => onSyncState(setState), []);

  // Mostra "Alterações enviadas" a cada novo envio e esconde depois de um tempo
  const sentAt = state?.lastSentAt ?? null;
  useEffect(() => {
    if (!sentAt) return;
    setShowSent(true);
    const timer = window.setTimeout(() => setShowSent(false), SENT_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [sentAt]);

  // Mensagens avulsas ("Baralho excluído.") também somem depois de um tempo
  const messageAt = state?.messageAt ?? 0;
  useEffect(() => {
    if (!messageAt) return;
    setShowMessage(true);
    const timer = window.setTimeout(() => setShowMessage(false), SENT_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [messageAt]);

  let tone = "";
  let content: React.ReactNode = null;
  if (state?.message && showMessage) {
    tone = state.messageTone === "erro" ? styles.error : styles.success;
    content = state.message;
  } else if (state && state.lastFailures.length > 0) {
    tone = styles.error;
    content =
      state.lastFailures.length === 1 ? (
        state.lastFailures[0]
      ) : (
        <ul className={styles.list}>
          {state.lastFailures.map((failure) => (
            <li key={failure}>{failure}</li>
          ))}
        </ul>
      );
  } else if (state && state.pending > 0 && state.offline) {
    content = pendingText(state.pending);
  } else if (showSent && state?.pending === 0) {
    tone = styles.success;
    content = "Alterações enviadas para sua conta.";
  }

  return (
    <div className={content ? styles.wrap : "sr-only"}>
      <div role="status" className={content ? `${styles.message} ${tone}` : undefined}>
        {content}
      </div>
    </div>
  );
}
