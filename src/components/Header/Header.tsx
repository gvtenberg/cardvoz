"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { Button } from "../Button";
import { Logo } from "../Logo";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Logo size="md" withTagline={true} />

        <nav aria-label="Navegação principal" className={styles.nav}>
          <Link href="/#meus-baralhos" className={styles.navLink}>
            <span>Meus Baralhos</span>
          </Link>

          <Button
            href="/baralhos/novo"
            variant="secondary"
            size="sm"
            aria-label="Criar novo baralho de fichas"
          >
            <Plus aria-hidden="true" />
            <span>Novo baralho</span>
          </Button>

          <div className={styles.divider} aria-hidden="true" />

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
