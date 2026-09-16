"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Plus, BookMarked } from "lucide-react";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link
          href="/"
          className={styles.brand}
          aria-label="CardVoz - Ir para a página inicial"
        >
          <div className={styles.brandMark} aria-hidden="true">
            <BookMarked />
          </div>
          <div className={styles.brandText}>
            <span className={styles.brandTitle}>CardVoz</span>
            <span className={styles.brandSubtitle}>fichas de estudo por voz</span>
          </div>
        </Link>

        <nav aria-label="Navegação principal" className={styles.nav}>
          <Link href="/#meus-baralhos" className={styles.navLink}>
            <span>Meus Baralhos</span>
          </Link>

          <Link
            href="/baralhos/novo"
            className={styles.newDeckBtn}
            aria-label="Criar novo baralho de fichas"
          >
            <Plus aria-hidden="true" />
            <span>Novo baralho</span>
          </Link>

          <div className={styles.divider} aria-hidden="true" />

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
