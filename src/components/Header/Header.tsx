"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp, Layers, LogIn, LogOut, Menu, User, X } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";
import { HelpDialog } from "../HelpDialog";
import { useAuth } from "../AuthProvider";
import { routes, samePath } from "@/lib/routes";
import { Logo } from "../Logo";
import styles from "./Header.module.scss";

export function Header() {
  const { status, logout } = useAuth();
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Fecha o menu ao trocar de página
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Esc fecha e devolve o foco ao botão; tocar fora do cabeçalho também fecha
  useEffect(() => {
    if (!menuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  // Sai e vai para a tela de entrar, que anuncia "Você saiu da sua conta."
  const handleLogout = () => {
    logout();
    router.replace(routes.login);
  };

  const isLoggedIn = status === "logado";
  const isLoggedOut = status === "deslogado" || status === "erro";
  const current = (href: string) => (samePath(href, pathname) ? "page" : undefined);

  // Mesmos links no cabeçalho (computador) e no menu (celular)
  const links = isLoggedIn
    ? [
        { href: routes.decks, label: "Meus baralhos", icon: Layers },
        { href: routes.profile, label: "Perfil", icon: User },
      ]
    : isLoggedOut
      ? [
          { href: routes.decks, label: "Meus baralhos", icon: Layers },
          { href: routes.login, label: "Entrar", icon: LogIn },
        ]
      : [];

  return (
    <header ref={headerRef} className={styles.header}>
      <div className={styles.container}>
        <Logo size="md" withTagline={false} compact />

        <div className={styles.tools}>
          <nav aria-label="Navegação principal" className={styles.inlineNav}>
            <ul className={styles.inlineList}>
              {links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={styles.navLink} aria-current={current(link.href)}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Ajuda fica sempre visível: é o ponto de orientação de quem se perdeu */}
          <button
            type="button"
            className={styles.helpButton}
            onClick={() => setHelpOpen(true)}
            aria-haspopup="dialog"
          >
            <CircleHelp aria-hidden="true" />
            <span>Ajuda</span>
          </button>

          <span className={styles.inlineOnly}>
            <ThemeToggle />
          </span>

          <button
            ref={menuButtonRef}
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            <span>{menuOpen ? "Fechar" : "Menu"}</span>
          </button>
        </div>
      </div>

      {/* Padrão "disclosure": lista de links comum, sem role="menu" (que exige setas e confunde o leitor de tela) */}
      <nav id="menu-principal" aria-label="Menu principal" hidden={!menuOpen} className={styles.menuPanel}>
        <ul className={styles.menuList}>
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className={styles.menuItem} aria-current={current(href)}>
                <Icon aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          ))}
          <li>
            <ThemeToggle variant="menu" />
          </li>
          {isLoggedIn && (
            <li>
              <button type="button" className={styles.menuItem} onClick={handleLogout}>
                <LogOut aria-hidden="true" />
                <span>Sair da conta</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </header>
  );
}
