import { useEffect, useState } from "react";

import { Modal } from "./Modal";
import styles from "./overlay.module.css";

export type ConfirmationLevel = "compact" | "standard" | "typed";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  level: ConfirmationLevel;
  confirmationText?: string;
  confirmLabel: string;
  busy?: boolean;
  onClose(): void;
  onConfirm(): void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  level,
  confirmationText = "",
  confirmLabel,
  busy = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (!open) setTypedValue("");
  }, [open]);

  const requiresTyping = level === "typed";
  const enabled = !busy && (!requiresTyping || typedValue === confirmationText);

  return (
    <Modal onClose={onClose} open={open} title={title}>
      <p className={styles.description}>{description}</p>
      {requiresTyping && (
        <label className={styles.typedField}>
          Digite {confirmationText} para confirmar
          <input
            autoComplete="off"
            onChange={(event) => setTypedValue(event.target.value)}
            value={typedValue}
          />
        </label>
      )}
      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.cancel}`}
          disabled={busy}
          onClick={onClose}
          type="button"
        >
          Cancelar
        </button>
        <button
          className={`${styles.button} ${level === "typed" ? styles.danger : styles.primary}`}
          disabled={!enabled}
          onClick={onConfirm}
          type="button"
        >
          {busy ? "Processando…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
