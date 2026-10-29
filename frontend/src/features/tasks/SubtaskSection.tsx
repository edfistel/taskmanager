import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ListChecks, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import { queryKeys } from "../../lib/api/queryKeys";
import type { Subtarefa } from "../../lib/api/types";
import { SubtasksApi } from "./subtasksApi";
import styles from "./task.module.css";

interface SubtaskSectionProps {
  taskId: number;
  mode: "owner" | "collaborator";
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível atualizar as subtarefas.";
}

export function SubtaskSection({ taskId, mode }: SubtaskSectionProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const owner = mode === "owner";
  const queryKey = queryKeys.subtasks(taskId);

  const query = useQuery({
    queryKey,
    queryFn: () => SubtasksApi.list(taskId),
  });

  const create = useMutation({
    mutationFn: (newTitle: string) => SubtasksApi.create(taskId, newTitle),
    onSuccess: (created) => {
      queryClient.setQueryData<Subtarefa[]>(queryKey, (current = []) => [...current, created]);
    },
  });
  const rename = useMutation({
    mutationFn: ({ id, newTitle }: { id: number; newTitle: string }) => SubtasksApi.rename(id, newTitle),
    onSuccess: (updated) => {
      queryClient.setQueryData<Subtarefa[]>(queryKey, (current = []) =>
        current.map((item) => item.id === updated.id ? updated : item),
      );
    },
  });
  const toggle = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      SubtasksApi.setCompleted(id, completed),
    onSuccess: (updated) => {
      queryClient.setQueryData<Subtarefa[]>(queryKey, (current = []) =>
        current.map((item) => item.id === updated.id ? updated : item),
      );
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => SubtasksApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Subtarefa[]>(queryKey, (current = []) =>
        current.filter((item) => item.id !== id),
      );
    },
  });

  const completed = useMemo(
    () => query.data?.filter((item) => item.concluida).length ?? 0,
    [query.data],
  );
  const total = query.data?.length ?? 0;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = title.trim();
    if (!normalized) return;
    setActionError(null);
    try {
      await create.mutateAsync(normalized);
      setTitle("");
    } catch (error) {
      setActionError(messageFrom(error));
    }
  }

  async function submitRename(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const normalized = editingTitle.trim();
    if (!normalized) return;
    setActionError(null);
    try {
      await rename.mutateAsync({ id, newTitle: normalized });
      setEditingId(null);
      setEditingTitle("");
    } catch (error) {
      setActionError(messageFrom(error));
    }
  }

  async function setCompleted(subtask: Subtarefa) {
    setActionError(null);
    try {
      await toggle.mutateAsync({ id: subtask.id, completed: !subtask.concluida });
    } catch (error) {
      setActionError(messageFrom(error));
    }
  }

  async function removeSubtask(id: number) {
    setActionError(null);
    try {
      await remove.mutateAsync(id);
    } catch (error) {
      setActionError(messageFrom(error));
    }
  }

  return (
    <section className={styles.relationSection}>
      <header className={styles.relationHeader}>
        <span className={styles.relationIcon}><ListChecks aria-hidden="true" size={17} /></span>
        <div><h3>Subtarefas</h3><p>Divida o trabalho em entregas menores.</p></div>
        {total > 0 && <strong className={styles.sectionCount}>{completed}/{total}</strong>}
      </header>

      {query.isPending ? (
        <div aria-label="Carregando subtarefas" className={styles.sectionLoading} role="status"><span /><span /></div>
      ) : query.isError ? (
        <div aria-label="Subtarefas indisponíveis" className={styles.sectionError} role="alert">
          <span>Não foi possível carregar as subtarefas.</span>
          <button onClick={() => void query.refetch()} type="button"><RotateCcw size={14} /> Tentar novamente</button>
        </div>
      ) : (
        <>
          {total > 0 && (
            <div className={styles.progressBlock}>
              <div><span>{completed} de {total} concluídas</span><strong>{progress}%</strong></div>
              <progress aria-label="Progresso das subtarefas" max={100} value={progress} />
            </div>
          )}

          <ul className={styles.subtaskList}>
            {query.data?.map((subtask) => (
              <li className={styles.subtaskItem} key={subtask.id}>
                {editingId === subtask.id ? (
                  <form className={styles.inlineEdit} onSubmit={(event) => void submitRename(event, subtask.id)}>
                    <label>
                      <span className={styles.srOnly}>Novo título de {subtask.titulo}</span>
                      <input
                        aria-label={`Novo título de ${subtask.titulo}`}
                        autoFocus
                        maxLength={200}
                        onChange={(event) => setEditingTitle(event.target.value)}
                        value={editingTitle}
                      />
                    </label>
                    <button aria-label="Salvar renomeação" className={styles.iconButtonSuccess} disabled={rename.isPending} type="submit"><Check size={15} /></button>
                    <button aria-label="Cancelar renomeação" className={styles.iconButton} onClick={() => setEditingId(null)} type="button"><X size={15} /></button>
                  </form>
                ) : (
                  <>
                    <label className={styles.checkRow}>
                      <input
                        aria-label={subtask.concluida ? `Reabrir ${subtask.titulo}` : `Marcar ${subtask.titulo} como concluída`}
                        checked={subtask.concluida}
                        disabled={toggle.isPending}
                        onChange={() => void setCompleted(subtask)}
                        type="checkbox"
                      />
                      <span className={subtask.concluida ? styles.completedText : undefined}>{subtask.titulo}</span>
                    </label>
                    {owner && (
                      <div className={styles.rowActions}>
                        <button aria-label={`Renomear ${subtask.titulo}`} className={styles.iconButton} onClick={() => { setEditingId(subtask.id); setEditingTitle(subtask.titulo); }} type="button"><Pencil size={14} /></button>
                        <button aria-label={`Excluir ${subtask.titulo}`} className={styles.iconButtonDanger} disabled={remove.isPending} onClick={() => void removeSubtask(subtask.id)} type="button"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
          {total === 0 && <p className={styles.relationEmpty}>Nenhuma subtarefa criada ainda.</p>}
        </>
      )}

      {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}

      {owner && (
        <form className={styles.relationComposer} onSubmit={(event) => void submitNew(event)}>
          <label>
            <span className={styles.srOnly}>Nova subtarefa</span>
            <input aria-label="Nova subtarefa" maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Adicionar uma subtarefa..." value={title} />
          </label>
          <button disabled={create.isPending || !title.trim()} type="submit"><Plus size={15} /> Adicionar subtarefa</button>
        </form>
      )}
    </section>
  );
}
