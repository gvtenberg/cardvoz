import React from "react";
import styles from "./Skeleton.module.scss";

export interface SkeletonProps {
  /** Padrão: 100% da largura */
  width?: string;
  /** Padrão: altura de uma linha de texto */
  height?: string;
  /** Raio da borda; por padrão, levemente arredondado */
  radius?: string;
  className?: string;
}

/**
 * Bloco de carregamento. É só decorativo (oculto para leitores de tela):
 * quem o usa deve anunciar o carregamento com um texto em role="status".
 */
export function Skeleton({ width, height, radius, className = "" }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}

/** Texto anunciado pelo leitor de tela enquanto o skeleton aparece na tela. */
export function LoadingStatus({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="sr-only">
      {children}
    </p>
  );
}
