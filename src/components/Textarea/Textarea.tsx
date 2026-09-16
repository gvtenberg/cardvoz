import React from "react";
import styles from "./Textarea.module.scss";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, hint, id, required, className = "", rows = 4, ...props },
    ref
  ) {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    return (
      <div className={styles.container}>
        {label && (
          <label htmlFor={textareaId} className={styles.label}>
            {label}
            {required && <span className={styles.required}> *</span>}
          </label>
        )}

        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={
            [error && errorId, hint && hintId].filter(Boolean).join(" ") ||
            undefined
          }
          className={`${styles.textarea} ${error ? styles.hasError : ""} ${className}`}
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

Textarea.displayName = "Textarea";
