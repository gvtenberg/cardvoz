"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  GoogleButton,
  Input,
  LoadingStatus,
  PasswordInput,
  Skeleton,
  useAuth,
} from "@/components";
import { ApiError, errorMessage } from "@/lib/http";
import { register } from "@/lib/auth/session";
import { isGoogleConfigured } from "@/lib/auth/google";
import { routes, safeRedirect } from "@/lib/routes";
import styles from "./page.module.scss";

// Mesmos limites da API (RegisterDto), para avisar antes de enviar
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "name" | "email" | "password";

function CadastroLoading({ message }: { message: string }) {
  return (
    <main id="main-content" className={styles.main}>
      <LoadingStatus>{message}</LoadingStatus>
      <div className={styles.skeleton} aria-hidden="true">
        <Skeleton width="50%" height="2.5rem" />
        <Skeleton width="90%" height="1.25rem" />
        <div className={styles.panel}>
          <Skeleton width="30%" height="1.25rem" />
          <Skeleton height="3.5rem" />
          <Skeleton width="30%" height="1.25rem" />
          <Skeleton height="3.5rem" />
          <Skeleton width="30%" height="1.25rem" />
          <Skeleton height="3.5rem" />
          <Skeleton height="4.5rem" radius="9999px" />
        </div>
      </div>
    </main>
  );
}

function CadastroContent() {
  const router = useRouter();
  const voltar = useSearchParams().get("voltar");
  const { status } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<Field, string>>({
    name: "",
    email: "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
  };
  const hasGoogle = isGoogleConfigured();

  // Logado (já estava ou acabou de criar a conta): segue para onde ia
  useEffect(() => {
    if (status === "logado") router.replace(safeRedirect(voltar));
  }, [status, voltar, router]);

  /** Mostra os erros nos campos e leva o foco ao primeiro deles. */
  const showFieldErrors = (errors: Record<Field, string>) => {
    setFieldErrors(errors);
    const first = (["name", "email", "password"] as const).find((field) => errors[field]);
    if (first) refs[first].current?.focus();
    return Boolean(first);
  };

  const clearFieldError = (field: Field) => {
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError("");

    const typedName = name.trim();
    const typedEmail = email.trim();
    const invalid = showFieldErrors({
      name: typedName ? "" : "Escreva seu nome.",
      email: !typedEmail
        ? "Escreva seu e-mail."
        : EMAIL_PATTERN.test(typedEmail)
          ? ""
          : "Confira o e-mail. Ele precisa ser como nome@exemplo.com.",
      password:
        password.length < PASSWORD_MIN
          ? `A senha precisa ter pelo menos ${PASSWORD_MIN} caracteres.`
          : password.length > PASSWORD_MAX
            ? `A senha pode ter no máximo ${PASSWORD_MAX} caracteres.`
            : "",
    });
    if (invalid) return;

    setSubmitting(true);
    try {
      // Ao dar certo, o AuthProvider fica logado e o efeito acima segue para "voltar"
      await register({ name: typedName, email: typedEmail, password });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ApiError && err.status === 409) {
        showFieldErrors({
          name: "",
          email: "Já existe uma conta com este e-mail. Para usá-la, toque em Entrar, mais abaixo.",
          password: "",
        });
        return;
      }
      // Erros por campo da API (chaves como "Email" e "Password")
      if (err instanceof ApiError && err.status === 400) {
        const first = (key: string) => err.fieldErrors[key]?.[0] ?? "";
        if (showFieldErrors({ name: first("Name"), email: first("Email"), password: first("Password") })) {
          return;
        }
      }
      setError(errorMessage(err, "Não foi possível criar a conta. Tente de novo."));
    }
  };

  if (status === "logado") {
    return <CadastroLoading message="Entrando..." />;
  }
  if (status === "carregando") {
    return <CadastroLoading message="Verificando sua sessão..." />;
  }

  return (
    <main id="main-content" className={styles.main}>
      <div>
        <h1 className={styles.title}>Criar conta</h1>
        <p className={styles.lead}>
          Com a conta, seus baralhos ficam guardados para você estudar quando quiser.
        </p>
      </div>

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <div className={styles.panel}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            ref={refs.name}
            label="Nome"
            autoComplete="name"
            autoCapitalize="words"
            maxLength={100}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            error={fieldErrors.name}
          />
          <Input
            ref={refs.email}
            label="E-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            error={fieldErrors.email}
          />
          <PasswordInput
            ref={refs.password}
            label="Senha"
            autoComplete="new-password"
            hint={`Pelo menos ${PASSWORD_MIN} caracteres.`}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearFieldError("password");
            }}
            error={fieldErrors.password}
          />
          {/* aria-disabled em vez de disabled: botão desativado perde o foco */}
          <Button type="submit" variant="primary" size="lg" block aria-disabled={submitting || undefined}>
            {submitting ? "Criando a conta..." : "Criar conta"}
          </Button>
        </form>

        {hasGoogle && (
          <>
            <p className={styles.or}>ou</p>
            <GoogleButton voltar={voltar} onStart={() => setError("")} onError={setError} />
          </>
        )}
      </div>

      <section className={styles.other} aria-labelledby="com-conta">
        <h2 id="com-conta" className={styles.otherTitle}>
          Já tem conta?
        </h2>
        <Button
          href={voltar ? routes.loginThenReturn(voltar) : routes.login}
          variant="soft"
          size="md"
          block
        >
          Entrar
        </Button>
      </section>

      <p className={styles.text}>
        Saiba o que guardamos na{" "}
        <Link href={routes.privacy} className={styles.link}>
          política de privacidade
        </Link>
        .
      </p>
    </main>
  );
}

// useSearchParams exige Suspense no site estático
export default function CadastroPage() {
  return (
    <Suspense fallback={<CadastroLoading message="Carregando..." />}>
      <CadastroContent />
    </Suspense>
  );
}
