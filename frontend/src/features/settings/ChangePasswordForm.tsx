import { useState, type FormEvent } from "react";
import { useToast } from "../../components/feedback/ToastProvider";
import { AccountApi } from "./accountApi";
import styles from "./settings.module.css";

export function ChangePasswordForm() {
  const { showToast } = useToast();
  const [senhaAtual, setCurrent] = useState("");
  const [novaSenha, setNew] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!senhaAtual) return setError("Informe a senha atual.");
    if (novaSenha.length < 8) return setError("A nova senha precisa ter no mínimo 8 caracteres.");
    if (novaSenha !== confirmation) return setError("As senhas não coincidem.");
    setBusy(true);
    try {
      await AccountApi.changePassword({ senhaAtual, novaSenha });
      setCurrent(""); setNew(""); setConfirmation("");
      showToast("Senha alterada com sucesso.", "success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível alterar a senha.");
    } finally { setBusy(false); }
  }
  return <form className={styles.section} onSubmit={submit} noValidate aria-labelledby="password-title">
    <h3 id="password-title">Segurança</h3>
    <label className={styles.field}>Senha atual<input type="password" autoComplete="current-password" value={senhaAtual} onChange={(event) => setCurrent(event.target.value)} disabled={busy} /></label>
    <label className={styles.field}>Nova senha<input type="password" autoComplete="new-password" value={novaSenha} onChange={(event) => setNew(event.target.value)} disabled={busy} aria-describedby="password-hint" /></label>
    <p id="password-hint">Use pelo menos 8 caracteres.</p>
    <label className={styles.field}>Confirmar nova senha<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={busy} /></label>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Salvando…" : "Alterar senha"}</button>
  </form>;
}
