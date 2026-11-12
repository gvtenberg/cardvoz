"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, deleteAccount, errorMessage } from "@/lib/api";
import { announce, setActiveAccount } from "@/lib/data";
import { removeAccountCopies } from "@/lib/data/transfer";
import { clearSavedAccount } from "@/lib/local/account";
import { routes } from "@/lib/routes";
import { Button } from "../Button";
import { Dialog } from "../Dialog";
import { Input } from "../Input";
import { PasswordInput } from "../PasswordInput";
import { useAuth } from "../AuthProvider";
import styles from "./DeleteAccountDialog.module.scss";

export interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Excluir a conta (LGPD). Pede o e-mail e, em conta com senha, a senha: a
 * mensagem é ouvida sem o contexto visual, então diz o que se perde.
 */
export function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  // aria-disabled + trava, e não disabled: o botão não perde o foco se der erro
  const [busy, setBusy] = useState(false);
  const askPassword = user?.hasPassword !== false;

  const close = () => {
    setEmail("");
    setPassword("");
    setEmailError("");
    setPasswordError("");
    setFormError("");
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !user) return;
    setEmailError("");
    setPasswordError("");
    setFormError("");
    if (!email.trim()) {
      setEmailError("Digite o seu e-mail para confirmar.");
      emailRef.current?.focus();
      return;
    }
    if (askPassword && !password) {
      setPasswordError("Digite a sua senha para confirmar.");
      passwordRef.current?.focus();
      return;
    }

    setBusy(true);
    try {
      await deleteAccount({ confirmEmail: email.trim(), ...(askPassword ? { password } : {}) });
    } catch (error) {
      setBusy(false);
      const fields = error instanceof ApiError ? error.fieldErrors : undefined;
      if (fields?.ConfirmEmail?.length) {
        setEmailError(fields.ConfirmEmail[0]);
        emailRef.current?.focus();
      } else if (fields?.Password?.length) {
        setPasswordError(fields.Password[0]);
        passwordRef.current?.focus();
      } else {
        setFormError(errorMessage(error, "Não foi possível excluir a conta. Tente de novo."));
      }
      return;
    }

    // A conta não existe mais: as cópias dela saem do aparelho (o que nunca foi
    // enviado continua aqui, como baralho do aparelho)
    setActiveAccount(null);
    removeAccountCopies(user.id);
    clearSavedAccount();
    close();
    logout();
    announce("Sua conta foi excluída. Os baralhos que estavam só neste aparelho continuam aqui.");
    router.replace(routes.decks);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Excluir sua conta?"
      footer={
        <div className={styles.actions}>
          <Button
            type="submit"
            form="excluir-conta"
            variant="danger"
            size="md"
            aria-disabled={busy || undefined}
          >
            {busy ? "Excluindo..." : "Excluir conta"}
          </Button>
          <Button variant="ghost" size="md" onClick={close}>
            Cancelar
          </Button>
        </div>
      }
    >
      <form id="excluir-conta" className={styles.form} onSubmit={submit} noValidate>
        <p>
          Isto apaga a sua conta e tudo o que ela guarda: baralhos, fichas, acertos e
          erros. Não dá para desfazer. Para guardar uma cópia, use antes{" "}
          <strong>Baixar meus dados</strong>.
        </p>
        {formError && (
          <p role="alert" className={styles.error}>
            {formError}
          </p>
        )}
        <Input
          ref={emailRef}
          id="excluir-email"
          label="Digite o seu e-mail para confirmar"
          type="email"
          autoComplete="email"
          value={email}
          error={emailError}
          onChange={(e) => setEmail(e.target.value)}
        />
        {askPassword && (
          <PasswordInput
            ref={passwordRef}
            id="excluir-senha"
            label="Sua senha"
            autoComplete="current-password"
            value={password}
            error={passwordError}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </form>
    </Dialog>
  );
}
