import { useEffect, useMemo, useState, type FormEvent } from "react";

import type { AtualizarTarefaInput, StatusTarefa, TarefaDetalhe } from "../../lib/api/types";
import { normalizeApiDate } from "../../lib/date";
import styles from "./task.module.css";

interface TaskFieldsProps {
  task: TarefaDetalhe;
  editable: boolean;
  busy: boolean;
  onSubmit(input: AtualizarTarefaInput): Promise<boolean>;
}

export function TaskFields({ task, editable, busy, onSubmit }: TaskFieldsProps) {
  const [title, setTitle] = useState(task.titulo);
  const [description, setDescription] = useState(task.descricao ?? "");
  const [deadline, setDeadline] = useState(normalizeApiDate(task.prazo) ?? "");
  const [status, setStatus] = useState<StatusTarefa>(task.status);

  useEffect(() => {
    setTitle(task.titulo);
    setDescription(task.descricao ?? "");
    setDeadline(normalizeApiDate(task.prazo) ?? "");
    setStatus(task.status);
  }, [task]);

  const changes = useMemo<AtualizarTarefaInput>(() => {
    const input: AtualizarTarefaInput = {};
    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim() || null;
    const normalizedDeadline = normalizeApiDate(deadline);
    if (normalizedTitle !== task.titulo) input.titulo = normalizedTitle;
    if (normalizedDescription !== (task.descricao ?? null)) input.descricao = normalizedDescription;
    if (normalizedDeadline !== normalizeApiDate(task.prazo)) input.prazo = normalizedDeadline;
    if (status !== task.status) input.status = status;
    return input;
  }, [deadline, description, status, task, title]);

  const dirty = Object.keys(changes).length > 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!editable || !dirty || !title.trim()) return;
    await onSubmit(changes);
  }

  return (
    <form className={styles.detailsForm} onSubmit={(event) => void submit(event)}>
      <label>
        <span>Título da tarefa</span>
        <input
          disabled={!editable || busy}
          maxLength={200}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
      </label>
      <label>
        <span>Descrição da tarefa</span>
        <textarea
          disabled={!editable || busy}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Nenhuma descrição informada"
          rows={5}
          value={description}
        />
      </label>
      <div className={styles.formGrid}>
        <label>
          <span>Prazo da tarefa</span>
          <input
            disabled={!editable || busy}
            onChange={(event) => setDeadline(event.target.value)}
            type="date"
            value={deadline}
          />
        </label>
        <label>
          <span>Status da tarefa</span>
          <select
            disabled={!editable || busy}
            onChange={(event) => setStatus(event.target.value as StatusTarefa)}
            value={status}
          >
            <option value="A_FAZER">A fazer</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDO">Concluído</option>
          </select>
        </label>
      </div>
      {editable && (
        <div className={styles.detailsSaveRow}>
          <p>O status é editado separadamente da posição da tarefa no quadro.</p>
          <button className={styles.primaryButton} disabled={busy || !dirty || !title.trim()} type="submit">
            {busy ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      )}
    </form>
  );
}
