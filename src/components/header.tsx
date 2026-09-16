"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Volume2, PlusCircle, Library } from "lucide-react";
import styles from "./Header.module.scss";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link
          href="/"
          className={styles.logo}
          aria-label="CardVoz - Página inicial"
        >
          <span className={styles.iconWrapper}>
            <Volume2 style={{ width: "1.25rem", height: "1.25rem" }} aria-hidden="true" />
          </span>
          <span className={styles.logoText}>
            CardVoz
            <span className={styles.badge}>Acessível</span>
          </span>
        </Link>

        <nav aria-label="Navegação principal" className={styles.nav}>
          <Link href="#meus-baralhos" className={styles.navLink}>
            <Library style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            <span>Meus Baralhos</span>
          </Link>

          <Link href="/baralhos/novo" className={styles.ctaButton}>
            <PlusCircle style={{ width: "1rem", height: "1rem" }} aria-hidden="true" />
            <span>Novo Baralho</span>
          </Link>

          <div className={styles.divider} aria-hidden="true" />

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
