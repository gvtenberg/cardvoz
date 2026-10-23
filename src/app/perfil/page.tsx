"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, useAuth } from "@/components";
import { routes } from "@/lib/routes";
import styles from "./page.module.scss";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });

export default function PerfilPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  // O AuthGate só mostra esta página com a pessoa logada
  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.replace(routes.login);
  };

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

      <Button variant="secondary" size="lg" block onClick={handleLogout}>
        <LogOut aria-hidden="true" />
        <span>Sair da conta</span>
      </Button>
    </main>
  );
}
