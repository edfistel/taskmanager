import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";

import type { RegisterInput } from "../../lib/auth/sessionManager";
import styles from "./auth.module.css";

interface RegisterFormProps {
  onSubmit(input: RegisterInput): Promise<unknown>;
}

export function RegisterForm({ onSubmit }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        nome: name.trim(),
        email: email.trim(),
        senha: password,
        remember,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível criar sua conta.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {error && (
        <p className={styles.formError} id="register-error" role="alert">
          {error}
        </p>
      )}
      <label className={styles.field}>
        <span>Nome de exibição</span>
        <span className={styles.inputWrap}>
          <UserRound aria-hidden="true" size={18} />
          <input
            autoComplete="name"
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </span>
      </label>
      <label className={styles.field}>
        <span>E-mail</span>
        <span className={styles.inputWrap}>
          <Mail aria-hidden="true" size={18} />
          <input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seunome@dominio.com"
            required
            type="email"
            value={email}
          />
        </span>
      </label>
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Senha</span>
          <span className={styles.inputWrap}>
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </span>
        </label>
        <label className={styles.field}>
          <span>Confirmar senha</span>
          <span className={styles.inputWrap}>
            <LockKeyhole aria-hidden="true" size={18} />
            <input
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setConfirmation(event.target.value)}
              required
              type="password"
              value={confirmation}
            />
          </span>
        </label>
      </div>
      <label className={styles.checkbox}>
        <input
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          type="checkbox"
        />
        <span>Manter conectado neste dispositivo</span>
      </label>
      <button className={styles.submit} disabled={busy} type="submit">
        <span>{busy ? "Criando…" : "Criar minha conta"}</span>
        <ArrowRight aria-hidden="true" size={19} />
      </button>
    </form>
  );
}
