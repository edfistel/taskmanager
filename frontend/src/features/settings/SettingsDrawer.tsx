import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../components/feedback/ToastProvider";
import { Modal } from "../../components/overlays/Modal";
import overlay from "../../components/overlays/overlay.module.css";
import { useAuth } from "../../lib/auth/useAuth";
import { AccountApi } from "./accountApi";
import { AccountSettings } from "./AccountSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import styles from "./settings.module.css";

interface Props { open: boolean; onClose(): void }
export function SettingsDrawer({ open, onClose }: Props) {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  async function endSession() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await logout();
    onClose();
  }
  async function removeAccount() {
    if (busy) return;
    setBusy(true);
    try {
      await AccountApi.deleteAccount();
      await endSession();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível excluir a conta.", "error");
    } finally { setBusy(false); }
  }
  async function signOut() {
    if (busy) return;
    setBusy(true);
    try { await endSession(); }
    catch { showToast("Não foi possível encerrar a sessão.", "error"); }
    finally { setBusy(false); }
  }
  if (!open) return null;
  // Swap dialogs so only one focus trap and Escape handler is mounted at a time.
  if (deleting) return <DeleteAccountDialog busy={busy} onClose={() => setDeleting(false)} onConfirm={() => void removeAccount()} />;
  return <Modal open title="Configurações" className={overlay.drawer} onClose={() => { if (!busy) onClose(); }}>
    <AppearanceSettings />
    <AccountSettings />
    <ChangePasswordForm />
    <section className={styles.section} aria-label="Sessão">
      <button className={styles.secondary} type="button" disabled={busy} onClick={() => void signOut()}>{busy ? "Saindo…" : "Sair da conta"}</button>
    </section>
    <section className={`${styles.section} ${styles.dangerZone}`} aria-labelledby="danger-title">
      <h3 id="danger-title">Excluir conta</h3><p>A exclusão é permanente e não pode ser desfeita.</p>
      <button className={styles.danger} type="button" disabled={busy} onClick={() => setDeleting(true)}>Excluir minha conta</button>
    </section>
  </Modal>;
}
