"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleHelp } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { HelpDialog } from "../HelpDialog";
import { routes } from "@/lib/routes";
import { Logo } from "../Logo";
import styles from "./Header.module.scss";

export function Header() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Logo size="md" withTagline={false} />

        <nav aria-label="Navegação principal" className={styles.nav}>
          <Link href={routes.decks} className={styles.navLink}>
            Meus baralhos
          </Link>

          <button
            type="button"
            className={styles.helpButton}
            onClick={() => setHelpOpen(true)}
            aria-haspopup="dialog"
          >
            <CircleHelp aria-hidden="true" />
            <span>Ajuda</span>
          </button>

          <ThemeToggle />
        </nav>
      </div>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
