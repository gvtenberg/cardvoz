import React from "react";
import styles from "./Badge.module.scss";

export type BadgeVariant =
  | "default"
  | "category"
  | "count"
  | "success"
  | "warning"
  | "danger";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: React.ReactNode;
}

export function Badge({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  );
}
