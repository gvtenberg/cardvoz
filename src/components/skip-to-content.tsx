"use client";

import React from "react";
import styles from "./SkipToContent.module.scss";

export function SkipToContent() {
  return (
    <a href="#main-content" className={styles.skipLink}>
      Pular para o conteúdo principal
    </a>
  );
}
