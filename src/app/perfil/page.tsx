"use client";

import { useState } from "react";
import { Download, LayoutDashboard, LogOut, Trash2 } from "lucide-react";
import { Button, DeleteAccountDialog, LogoutDialog, useAuth } from "@/components";
import { errorMessage, exportAccount, resendEmailConfirmation } from "@/lib/api";
import { downloadJson } from "@/lib/exportDecks";
import { adminPanelUrl } from "@/lib/routes";
import styles from "./page.module.scss";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export default function PerfilPage() {
  const { user } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [sendingConfirmation, setSendingConfirmation] = useState(false);

  const sendConfirmation = async () => {
    if (sendingConfirmation) return;
    setSendingConfirmation(true);
    try {
      setConfirmMessage(await resendEmailConfirmation());
    } catch (error) {
      setConfirmMessage(errorMessage(error, "Não foi possível enviar o link. Tente de novo."));
    } finally {
      setSendingConfirmation(false);
    }
  };

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
            <dd>
              {user.email}
              {user.emailConfirmed !== undefined && (
                <span className={styles.emailState}>
                  {user.emailConfirmed ? " (confirmado)" : " (não confirmado)"}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>Conta criada em</dt>
            <dd>{dateFormat.format(new Date(user.createdAt))}</dd>
          </div>
        </dl>
        {/* Confirmar não é obrigatório: serve para entrar também com o Google nesta conta */}
        {user.emailConfirmed === false && (
          <div className={styles.confirm}>
            <p>
              Confirme o seu e-mail para poder entrar também com o Google nesta conta.
            </p>
            <p role="status" className={confirmMessage ? styles.status : "sr-only"}>
              {confirmMessage}
            </p>
            <Button variant="soft" size="md" onClick={sendConfirmation} aria-disabled={sendingConfirmation || undefined}>
              {sendingConfirmation ? "Enviando..." : "Enviar link de confirmação"}
            </Button>
          </div>
        )}
      </section>

      {/* Só para a equipe: atalho para o painel, que pede login de novo (é outro site) */}
      {user.isAdmin && (
        <section className={styles.panel} aria-labelledby="painel-titulo">
          <h2 id="painel-titulo" className={styles.panelTitle}>
            Painel da equipe
          </h2>
          <p>No painel, você cuida das contas e dos baralhos prontos.</p>
          <Button href={adminPanelUrl} variant="soft" size="md">
            <LayoutDashboard aria-hidden="true" />
            <span>Abrir o painel da equipe</span>
          </Button>
        </section>
      )}

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
