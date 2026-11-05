import { Check, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import styles from "./board.module.css";

interface ListComposerProps {
  busy: boolean;
  onCreate(name: string): Promise<boolean>;
}

export function ListComposer({ busy, onCreate }: ListComposerProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function submit() {
    const normalized = name.trim();
    if (!normalized) return;
    if (await onCreate(normalized)) {
      setName("");
      setOpen(false);
    }
  }

  function cancel() {
    if (busy) return;
    setName("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button className={styles.addListButton} onClick={() => setOpen(true)} type="button">
        <span><Plus aria-hidden="true" size={22} /></span>
        <strong>Adicionar lista</strong>
        <small>Crie uma nova etapa no fluxo</small>
      </button>
    );
  }

  return (
    <div className={styles.composer}>
      <label htmlFor="new-list-name">Nome da nova lista</label>
      <input
        disabled={busy}
        id="new-list-name"
        maxLength={100}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") void submit();
          if (event.key === "Escape") cancel();
        }}
        placeholder="Ex.: Em revisão"
        ref={inputRef}
        value={name}
      />
      <div className={styles.composerActions}>
        <button className={styles.createListButton} disabled={busy || !name.trim()} onClick={() => void submit()} type="button">
          <Check aria-hidden="true" size={17} /> {busy ? "Criando…" : "Criar lista"}
        </button>
        <button aria-label="Cancelar nova lista" className={styles.cancelComposerButton} disabled={busy} onClick={cancel} type="button">
          <X aria-hidden="true" size={18} />
        </button>
      </div>
    </div>
  );
}
