import React from "react";
import styles from "./SkipLink.module.scss";

export interface SkipLinkProps {
  targetId?: string;
  children?: React.ReactNode;
}

export function SkipLink({
  targetId = "main-content",
  children = "Pular para o conteúdo principal",
}: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className={styles.skipLink}>
      {children}
    </a>
  );
}
