"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { Dialog } from "../Dialog";
import { useAuth } from "../AuthProvider";
import * as api from "@/lib/api";
import { errorMessage } from "@/lib/http";
import { announce, syncAccount } from "@/lib/data";
import {
  findDuplicate,
  onTransferRequest,
  relinkUnchanged,
  takeOfferTransfer,
  transferDeck,
  uploadCandidates,
  type Choice,
  type Duplicate,
} from "@/lib/data/transfer";
import { findLocalDeck } from "@/lib/local/decks";
import styles from "./AccountTransfer.module.scss";

type Phase =
  | { name: "fechado" }
  | { name: "pergunta"; count: number }
  | { name: "levando"; index: number; total: number }
  | { name: "repetido"; title: string; duplicate: NonNullable<Duplicate> };

function decksText(n: number) {
  return n === 1 ? "1 baralho" : `${n} baralhos`;
}

/**
 * Logo depois de entrar, pergunta se a pessoa quer levar para a conta os
 * baralhos que estão só no aparelho (única vez em que um diálogo abre sozinho).
 * Também atende o botão "Levar para a conta" da página do baralho.
 */
export function AccountTransfer() {
  const { status, user } = useAuth();
  const [phase, setPhase] = useState<Phase>({ name: "fechado" });
  // Escolha do diálogo de repetidos (resolve a espera do envio)
  const choiceRef = useRef<((choice: Choice | null) => void) | null>(null);
  const cancelledRef = useRef(false);
  const busyRef = useRef(false);

  // Ao entrar: religa os que voltaram sem mudanças e pergunta pelo resto
  useEffect(() => {
    if (status !== "logado" || !user || !takeOfferTransfer()) return;
    const relinked = relinkUnchanged(user.id);
    if (relinked > 0) void syncAccount();
    const count = uploadCandidates(user.id).length;
    if (count > 0) setPhase({ name: "pergunta", count });
  }, [status, user]);

  const askDuplicate = (title: string, duplicate: NonNullable<Duplicate>) =>
    new Promise<Choice | null>((resolve) => {
      choiceRef.current = resolve;
      setPhase({ name: "repetido", title, duplicate });
    });

  const run = useCallback(
    async (deckIds: string[]) => {
      if (!user || busyRef.current) return;
      busyRef.current = true;
      cancelledRef.current = false;
      // Espera as cópias da conta chegarem: sem elas, um "Biologia" repetido não seria percebido
      setPhase({ name: "levando", index: 0, total: deckIds.length });
      await syncAccount();
      let moved = 0;
      const failed: string[] = [];
      let offlineMessage = "";

      for (let i = 0; i < deckIds.length && !cancelledRef.current; i++) {
        const local = findLocalDeck(deckIds[i]);
        if (!local || local.kind !== "aparelho") continue;
        setPhase({ name: "levando", index: i + 1, total: deckIds.length });

        const duplicate = findDuplicate(local, user.id);
        let choice: Choice | null = "levar";
        if (duplicate) {
          choice = await askDuplicate(local.title, duplicate);
          if (!choice) break;
          setPhase({ name: "levando", index: i + 1, total: deckIds.length });
        }
        try {
          await transferDeck(local, choice, user.id, api, duplicate);
          moved++;
        } catch (e) {
          failed.push(local.title);
          // Sem internet, os próximos também falhariam
          if (e instanceof api.ApiError && e.status === 0) {
            offlineMessage = errorMessage(e, "");
            break;
          }
        }
      }

      busyRef.current = false;
      setPhase({ name: "fechado" });
      const parts: string[] = [];
      if (moved > 0) parts.push(moved === 1 ? "1 baralho levado para sua conta." : `${moved} baralhos levados para sua conta.`);
      for (const title of failed) {
        parts.push(`Não foi possível levar “${title}”. Tente de novo na página do baralho.`);
      }
      if (offlineMessage) parts.push(offlineMessage);
      if (parts.length > 0) announce(parts.join(" "), failed.length > 0 ? "erro" : "sucesso");
      void syncAccount();
    },
    [user]
  );

  // Botão "Levar para a conta" da página do baralho
  useEffect(() => onTransferRequest((ids) => void run(ids)), [run]);

  const chooseDuplicate = (choice: Choice | null) => {
    const resolve = choiceRef.current;
    choiceRef.current = null;
    resolve?.(choice);
  };

  const handleClose = () => {
    if (phase.name === "repetido") {
      // Fechar no repetido = não levar este nem os próximos
      cancelledRef.current = true;
      chooseDuplicate(null);
      return;
    }
    if (phase.name === "levando") {
      // Termina o baralho atual e para
      cancelledRef.current = true;
      return;
    }
    setPhase({ name: "fechado" });
  };

  // Um diálogo só, sempre montado: abrir e fechar (e não desmontar) devolve o foco
  // para onde a pessoa estava
  let title = "Levar para sua conta?";
  let body: React.ReactNode = null;
  let footer: React.ReactNode = null;

  if (phase.name === "pergunta") {
    body = (
      <p className={styles.text}>
        Você tem {decksText(phase.count)} neste aparelho. Levar para sua conta?
      </p>
    );
    footer = (
      <div className={styles.actions}>
        <Button
          variant="primary"
          size="md"
          onClick={() => void run(uploadCandidates(user?.id ?? "").map((d) => d.id))}
        >
          Levar para a conta
        </Button>
        <Button variant="secondary" size="md" onClick={() => setPhase({ name: "fechado" })}>
          Agora não
        </Button>
      </div>
    );
  } else if (phase.name === "levando") {
    body = (
      <p role="status" className={styles.progress}>
        {phase.index === 0
          ? "Conferindo os baralhos da sua conta..."
          : `Levando ${phase.index} de ${decksText(phase.total)}...`}
      </p>
    );
  } else if (phase.name === "repetido") {
    title = `Já existe “${phase.title}” na sua conta.`;
    body = (
      <>
        <p className={styles.text}>Escolha qual versão de “{phase.title}” você quer guardar.</p>
        <p className={styles.warning}>
          Ficar com o do aparelho apaga o histórico de estudo deste baralho na conta.
        </p>
      </>
    );
    footer = (
      <div className={styles.actions}>
        <Button variant="primary" size="md" onClick={() => chooseDuplicate("ficarAparelho")}>
          Ficar com o do aparelho
        </Button>
        <Button variant="secondary" size="md" onClick={() => chooseDuplicate("ficarConta")}>
          Ficar com o da conta
        </Button>
        <Button variant="secondary" size="md" onClick={() => chooseDuplicate("manterDois")}>
          Manter os dois
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={phase.name !== "fechado"} onClose={handleClose} title={title} footer={footer}>
      {body}
    </Dialog>
  );
}
