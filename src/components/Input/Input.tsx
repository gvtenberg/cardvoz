import React from "react";
import styles from "./Input.module.scss";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, hint, id, required, className = "", ...props },
    ref
  ) {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className={styles.container}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
        )}

        <input
          id={inputId}
          ref={ref}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
            undefined
          }
          className={`${styles.input} ${error ? styles.hasError : ""} ${className}`}
          {...props}
        />

        {error && (
          <p id={errorId} role="alert" className={styles.error}>
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
