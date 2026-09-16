import React from "react";
import styles from "./Kbd.module.scss";

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}

export function Kbd({
  size = "md",
  className = "",
  children,
  ...props
}: KbdProps) {
  return (
    <kbd
      className={`${styles.kbd} ${styles[size]} ${className}`}
      {...props}
    >
      {children}
    </kbd>
  );
}
