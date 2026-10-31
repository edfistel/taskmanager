import { Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";

import styles from "./compactDelete.module.css";
import taskStyles from "./task.module.css";

interface CompactDeleteProps {
  label: string;
  question: string;
  disabled: boolean;
  onConfirm: () => Promise<void>;
}

export function CompactDelete({ label, question, disabled, onConfirm }: CompactDeleteProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  function cancel() {
    if (busy) return;
    setOpen(false);
    setError(null);
    trigger.current?.focus();
  }

  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível excluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.anchor}>
      <button
        aria-expanded={open}
        aria-label={label}
        className={taskStyles.iconButtonDanger}
        disabled={disabled}
        onClick={() => { setOpen(true); setError(null); }}
        ref={trigger}
        type="button"
      ><Trash2 size={14} /></button>
      {open && (
        <div
          aria-busy={busy}
          aria-labelledby={titleId}
          className={styles.confirmation}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              cancel();
            }
          }}
          role="group"
        >
          <p id={titleId}>{question}</p>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <div className={styles.actions}>
            <button aria-label="Cancelar exclusão" autoFocus disabled={busy} onClick={cancel} type="button">Cancelar</button>
            <button aria-label={busy ? "Excluindo" : "Confirmar exclusão"} className={styles.danger} disabled={busy} onClick={() => void confirm()} type="button">{busy ? "Excluindo..." : "Excluir"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
