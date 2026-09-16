import React from "react";
import Link from "next/link";
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
  md: { width: 48, height: 29 },
  lg: { width: 64, height: 39 },
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
        <svg
          viewBox="0 0 673 409"
          width={dimensions.width}
          height={dimensions.height}
          className={styles.iconSvg}
          focusable="false"
        >
          {/* Ficha traseira (fundo) */}
          <rect
            x="40"
            y="40"
            width="368"
            height="262"
            rx="34"
            className={styles.backCard}
          />
          {/* Ficha frontal */}
          <rect
            x="111"
            y="111"
            width="369"
            height="263"
            rx="34"
            className={styles.frontCard}
          />
          {/* Arcos acústicos de som concêntricos */}
          <path
            d="M 517,166 L 525,168 L 533,178 L 539,190 L 544,211 L 542,237 L 539,246 L 529,264 L 522,270 L 515,270 L 509,265 L 508,262 L 509,254 L 519,238 L 523,218 L 519,198 L 508,179 L 509,172 L 511,169 L 516,167 Z"
            className={styles.soundArc}
          />
          <path
            d="M 550,133 L 557,135 L 563,141 L 577,164 L 584,183 L 589,212 L 588,235 L 582,260 L 572,282 L 560,299 L 554,303 L 547,303 L 540,295 L 542,286 L 557,265 L 563,250 L 567,232 L 567,204 L 564,190 L 554,166 L 541,148 L 542,138 L 549,134 Z"
            className={styles.soundArc}
          />
          <path
            d="M 581,101 L 587,101 L 592,104 L 603,118 L 615,138 L 627,169 L 633,200 L 633,236 L 626,271 L 614,300 L 593,331 L 588,335 L 579,335 L 573,328 L 573,322 L 589,300 L 603,272 L 611,240 L 612,205 L 609,185 L 603,164 L 591,139 L 575,118 L 573,113 L 575,105 L 580,102 Z"
            className={styles.soundArc}
          />
        </svg>
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
