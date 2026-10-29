import { useEffect, useState, type FormEvent } from "react";

import { Modal } from "../../components/overlays/Modal";
import type { CriarTarefaInput, Lista, StatusTarefa } from "../../lib/api/types";
import { normalizeApiDate } from "../../lib/date";
import styles from "./task.module.css";

interface TaskCreateDialogProps {
  open: boolean;
  list: Lista | null;
  busy: boolean;
  onClose(): void;
  onSubmit(input: CriarTarefaInput): Promise<boolean>;
}

export function TaskCreateDialog({
  open,
  list,
  busy,
  onClose,
  onSubmit,
}: TaskCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState<StatusTarefa>("A_FAZER");

  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setDeadline("");
      setStatus("A_FAZER");
    }
  }, [open]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;

    const saved = await onSubmit({
      titulo: normalizedTitle,
      descricao: description.trim() || null,
      prazo: normalizeApiDate(deadline),
      status,
    });
    if (saved) onClose();
  }

  return (
    <Modal onClose={onClose} open={open} title="Nova tarefa">
      <p className={styles.dialogIntro}>
        A tarefa será adicionada ao final de <strong>{list?.nome ?? "esta lista"}</strong>.
      </p>
      <form className={styles.taskForm} onSubmit={(event) => void submit(event)}>
        <label>
          <span>Título da tarefa</span>
          <input
            autoFocus
            disabled={busy}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Revisar proposta comercial"
            required
            value={title}
          />
          <small>{title.length}/200</small>
        </label>
        <label>
          <span>Descrição (opcional)</span>
          <textarea
            disabled={busy}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Adicione contexto para quem vai executar"
            rows={4}
            value={description}
          />
        </label>
        <div className={styles.formGrid}>
          <label>
            <span>Prazo (opcional)</span>
            <input
              disabled={busy}
              onChange={(event) => setDeadline(event.target.value)}
              type="date"
              value={deadline}
            />
          </label>
          <label>
            <span>Status inicial</span>
            <select
              disabled={busy}
              onChange={(event) => setStatus(event.target.value as StatusTarefa)}
              value={status}
            >
              <option value="A_FAZER">A fazer</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="CONCLUIDO">Concluído</option>
            </select>
          </label>
        </div>
        <div className={styles.formActions}>
          <button className={styles.cancelButton} disabled={busy} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className={styles.primaryButton} disabled={busy || !title.trim()} type="submit">
            {busy ? "Criando…" : "Criar tarefa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
