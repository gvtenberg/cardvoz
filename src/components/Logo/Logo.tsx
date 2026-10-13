import React, { useId } from "react";
import Link from "next/link";
import styles from "./Logo.module.scss";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  href?: string;
  asLink?: boolean;
  className?: string;
}

// Ícone quadrado (viewBox 64x64): largura e altura iguais
const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 56,
};

/**
 * Ícone da marca: pilha de fichas com barras de voz na ficha da frente.
 * O vão entre as fichas é uma máscara (transparente), então funciona sobre
 * qualquer fundo e também em uma cor só.
 */
export function LogoIcon({ size = 40, className = "" }: { size?: number; className?: string }) {
  const maskId = `logo-vao-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={`${styles.iconSvg} ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="64" height="64" fill="#fff" />
          <rect x="3.5" y="15.5" width="53" height="45" rx="12.5" fill="#000" />
        </mask>
      </defs>
      <rect x="15" y="7" width="42" height="32" rx="8" className={styles.back} mask={`url(#${maskId})`} />
      <rect x="7" y="19" width="46" height="38" rx="9" className={styles.front} />
      <path d="M19.5 35v6M26.5 31v14M33.5 33v10M40.5 36v4" className={styles.bars} />
    </svg>
  );
}

export function Logo({
  size = "md",
  withTagline = true,
  href = "/",
  asLink = true,
  className = "",
}: LogoProps) {
  const content = (
    <>
      <LogoIcon size={SIZE_MAP[size] || SIZE_MAP.md} />
      <div className={styles.textContainer}>
        <span className={styles.brandTitle}>
          Card<span className={styles.brandAccent}>Voz</span>
        </span>
        {withTagline && (
          <span className={styles.brandSubtitle}>
            fichas de estudo por voz
          </span>
        )}
      </div>
    </>
  );

  const containerClasses = `${styles.logo} ${styles[size]} ${className}`.trim();

  if (asLink) {
    return (
      <Link
        href={href}
        className={`${containerClasses} ${styles.isLink}`}
        aria-label="CardVoz - Ir para a página inicial"
      >
        {content}
      </Link>
    );
  }

  return <div className={containerClasses}>{content}</div>;
}
