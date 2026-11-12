"use client";

import { useState } from "react";
import { Download, LogOut, Trash2 } from "lucide-react";
import { Button, DeleteAccountDialog, LogoutDialog, useAuth } from "@/components";
import { errorMessage, exportAccount } from "@/lib/api";
import { downloadJson } from "@/lib/exportDecks";
import styles from "./page.module.scss";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export default function PerfilPage() {
  const { user } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Baixa tudo o que a conta guarda (LGPD), num arquivo JSON
  const downloadData = async () => {
    if (downloading) return;
    setDownloading(true);
    setStatusMessage("Preparando os seus dados...");
    try {
      downloadJson(`cardvoz-meus-dados-${new Date().toISOString().slice(0, 10)}.json`, await exportAccount());
      setStatusMessage("Seus dados foram baixados para a pasta Downloads.");
    } catch (error) {
      setStatusMessage(errorMessage(error, "Não foi possível baixar os seus dados. Tente de novo."));
    } finally {
      setDownloading(false);
    }
  };

  // O AuthGate só mostra esta página com a pessoa logada
  if (!user) return null;

  return (
    <main id="main-content" className={styles.main}>
      <h1 className={styles.title}>Seu perfil</h1>

      <section className={styles.panel} aria-labelledby="dados-titulo">
        <h2 id="dados-titulo" className={styles.panelTitle}>
          Seus dados
        </h2>
        <dl className={styles.data}>
          <div>
            <dt>Nome</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Conta criada em</dt>
            <dd>{dateFormat.format(new Date(user.createdAt))}</dd>
          </div>
        </dl>
      </section>

      <Button variant="secondary" size="lg" block onClick={() => setLogoutOpen(true)}>
        <LogOut aria-hidden="true" />
        <span>Sair da conta</span>
      </Button>

      {/* Direitos sobre os próprios dados (LGPD) */}
      <section className={styles.panel} aria-labelledby="privacidade-titulo">
        <h2 id="privacidade-titulo" className={styles.panelTitle}>
          Seus dados na conta
        </h2>
        <p role="status" className={statusMessage ? styles.status : "sr-only"}>
          {statusMessage}
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" size="md" onClick={downloadData} aria-disabled={downloading || undefined}>
            <Download aria-hidden="true" />
            <span>Baixar meus dados</span>
          </Button>
          <Button variant="danger" size="md" onClick={() => setDeleteOpen(true)}>
            <Trash2 aria-hidden="true" />
            <span>Excluir conta</span>
          </Button>
        </div>
      </section>

      <LogoutDialog open={logoutOpen} onClose={() => setLogoutOpen(false)} />
      <DeleteAccountDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </main>
  );
}
