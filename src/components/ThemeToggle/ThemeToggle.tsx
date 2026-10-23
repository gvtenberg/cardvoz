"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.scss";

export interface ThemeToggleProps {
  /**
   * "icon": botão redondo só com ícone (cabeçalho no computador).
   * "menu": linha larga com texto "Tema escuro" (menu do celular), mais fácil de
   * identificar com baixa visão do que um ícone sozinho.
   */
  variant?: "icon" | "menu";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  if (variant === "menu") {
    // Botão de alternância: o leitor de tela diz "Tema escuro, ativado/desativado"
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={mounted ? isDark : undefined}
        disabled={!mounted}
        className={`${styles.menuButton} ${className}`}
      >
        <Moon aria-hidden="true" />
        <span>Tema escuro</span>
        <span className={styles.menuState} aria-hidden="true">
          {mounted && (isDark ? "Ligado" : "Desligado")}
        </span>
      </button>
    );
  }

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Carregando alternador de tema"
        className={`${styles.toggleButton} ${className}`}
      >
        <span className="sr-only">Carregando tema</span>
      </button>
    );
  }

  const nextThemeLabel = isDark ? "Alternar para modo claro" : "Alternar para modo escuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${styles.toggleButton} ${className}`}
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      <span className="sr-only">{nextThemeLabel}</span>
    </button>
  );
}
