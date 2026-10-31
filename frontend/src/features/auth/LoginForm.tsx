import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { extractApiMessage } from "../../lib/api/errors";
import type { LoginInput } from "../../lib/auth/sessionManager";
import styles from "./auth.module.css";

interface LoginFormProps {
  initialEmail?: string;
  initialMessage?: string;
  onSubmit(input: LoginInput): Promise<unknown>;
}

export function LoginForm({ initialEmail = "", initialMessage, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialMessage ?? null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ email: email.trim(), senha: password, remember });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : extractApiMessage(submitError, "Não foi possível entrar."),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <p className={styles.formError} id="login-error" role="alert">
          {error}
        </p>
      )}
      <label className={styles.field}>
        <span>E-mail</span>
        <span className={styles.inputWrap}>
          <Mail aria-hidden="true" size={18} />
          <input
            aria-describedby={error ? "login-error" : undefined}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seunome@dominio.com"
            required
            type="email"
            value={email}
          />
        </span>
      </label>
      <label className={styles.field}>
        <span>Senha</span>
        <span className={styles.inputWrap}>
          <LockKeyhole aria-hidden="true" size={18} />
          <input
            autoComplete="current-password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className={styles.reveal}
            onClick={() => setShowPassword((shown) => !shown)}
            type="button"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      <label className={styles.checkbox}>
        <input
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          type="checkbox"
        />
        <span>Manter conectado neste dispositivo</span>
      </label>
      <button className={styles.submit} disabled={busy} type="submit">
        <span>{busy ? "Entrando…" : "Entrar"}</span>
        <ArrowRight aria-hidden="true" size={19} />
      </button>
    </form>
  );
}
