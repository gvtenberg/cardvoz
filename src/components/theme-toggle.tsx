"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import styles from "./ThemeToggle.module.scss";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        aria-label="Carregando seletor de tema"
        className={styles.toggleButton}
      >
        <span className="sr-only">Carregando tema</span>
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === "system") {
      setTheme("light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  const getThemeLabel = () => {
    if (theme === "system") return "Tema do Sistema";
    if (theme === "dark") return "Tema Escuro";
    return "Tema Claro";
  };

  const getNextThemeDescription = () => {
    if (theme === "system") return "Mudar para modo claro";
    if (theme === "light") return "Mudar para modo escuro";
    return "Mudar para tema do sistema";
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={styles.toggleButton}
      aria-label={`Alternar tema. Atual: ${getThemeLabel()}. Próximo: ${getNextThemeDescription()}`}
      title={`Alternar tema (${getThemeLabel()})`}
    >
      {theme === "system" ? (
        <Monitor aria-hidden="true" />
      ) : resolvedTheme === "dark" ? (
        <Moon aria-hidden="true" />
      ) : (
        <Sun aria-hidden="true" />
      )}
      <span className="sr-only">{`Tema atual: ${getThemeLabel()}`}</span>
    </button>
  );
}
