"use client";

import { useRouter } from "next/navigation";
import { Button } from "../Button";
import { Dialog } from "../Dialog";
import { useAuth } from "../AuthProvider";
import { announce, setActiveAccount } from "@/lib/data";
import { convertCopiesToDevice, removeAccountCopies } from "@/lib/data/transfer";
import { clearSavedAccount } from "@/lib/local/account";
import { pendingCount } from "@/lib/local/queue";
import { routes } from "@/lib/routes";
import styles from "./LogoutDialog.module.scss";

export interface LogoutDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * "Sair da conta": a pessoa escolhe se os baralhos da conta continuam no
 * aparelho (viram baralhos do aparelho, editáveis sem login) ou saem dele.
 * Nos dois casos eles continuam guardados na conta.
 */
export function LogoutDialog({ open, onClose }: LogoutDialogProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const pending = user && open ? pendingCount(user.id) : 0;

  const leave = (keep: boolean) => {
    // Primeiro desliga a conta: uma sincronização ainda em andamento para de gravar
    setActiveAccount(null);
    if (user) {
      if (keep) convertCopiesToDevice(user.id);
      else removeAccountCopies(user.id);
    }
    clearSavedAccount();
    onClose();
    logout();
    announce("Você saiu da sua conta.");
    router.replace(routes.decks);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Sair da conta?"
      footer={
        <div className={styles.actions}>
          <Button variant="primary" size="md" onClick={() => leave(true)}>
            Manter neste aparelho
          </Button>
          <Button variant="secondary" size="md" onClick={() => leave(false)}>
            Apagar deste aparelho
          </Button>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      }
    >
      <p className={styles.text}>
        Os baralhos da sua conta estão guardados neste aparelho. Quem usar este aparelho
        poderá vê-los.
      </p>
      {pending > 0 && (
        <p className={styles.warning}>
          {pending === 1
            ? "1 alteração ainda não foi enviada para sua conta. Se você apagar, ela se perde."
            : `${pending} alterações ainda não foram enviadas para sua conta. Se você apagar, elas se perdem.`}
        </p>
      )}
    </Dialog>
  );
}
