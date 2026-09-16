"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.scss";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Carregando alternador de tema"
        className={styles.toggleButton}
      >
        <span className="sr-only">Carregando tema</span>
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const nextThemeLabel = isDark
    ? "Alternar para modo claro"
    : "Alternar para modo escuro";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={styles.toggleButton}
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
    >
      {isDark ? (
        <Sun aria-hidden="true" />
      ) : (
        <Moon aria-hidden="true" />
      )}
      <span className="sr-only">{nextThemeLabel}</span>
    </button>
  );
}
