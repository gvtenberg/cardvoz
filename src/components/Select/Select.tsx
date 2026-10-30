import React from "react";
import styles from "./Select.module.scss";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
}

/** Lista de opções nativa (o leitor de tela já sabe usar), no visual dos campos. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, options, id, className = "", ...props },
  ref
) {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const hintId = `${selectId}-hint`;

  return (
    <div className={styles.container}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <select
        id={selectId}
        ref={ref}
        aria-describedby={hint ? hintId : undefined}
        className={`${styles.select} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
    </div>
  );
});
