"use client";

import React, { useState } from "react";
import { Input, type InputProps } from "../Input";
import styles from "./PasswordInput.module.scss";

export type PasswordInputProps = Omit<InputProps, "type">;

/**
 * Campo de senha com "Mostrar senha". O leitor de tela não lê o que foi digitado
 * num campo de senha, e com baixa visão é difícil conferir os pontinhos: mostrar
 * a senha é o jeito de saber se ela foi digitada certo.
 */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className={styles.field}>
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...props}
        />
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
          />
          <span>Mostrar senha</span>
        </label>
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
