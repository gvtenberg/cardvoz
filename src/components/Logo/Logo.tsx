import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Logo.module.scss";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  href?: string;
  asLink?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 36, height: 22 },
  md: { width: 46, height: 28 },
  lg: { width: 62, height: 38 },
};

export function Logo({
  size = "md",
  withTagline = true,
  href = "/",
  asLink = true,
  className = "",
}: LogoProps) {
  const dimensions = SIZE_MAP[size] || SIZE_MAP.md;

  const content = (
    <>
      <div className={styles.iconContainer} aria-hidden="true">
        <Image
          src="/assets/cardvoz-icon-transparent.png"
          alt=""
          width={dimensions.width}
          height={dimensions.height}
          priority
          className={styles.iconImage}
        />
      </div>
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
