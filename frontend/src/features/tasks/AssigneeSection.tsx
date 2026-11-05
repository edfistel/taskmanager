import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MailPlus, RotateCcw, UserRoundCheck, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { queryKeys } from "../../lib/api/queryKeys";
import type { Atribuicao } from "../../lib/api/types";
import { AssigneesApi } from "./assigneesApi";
import styles from "./task.module.css";

interface AssigneeSectionProps {
  taskId: number;
  mode: "owner" | "collaborator";
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível atualizar os responsáveis.";
}

function initials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

export function AssigneeSection({ taskId, mode }: AssigneeSectionProps) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const owner = mode === "owner";
  const queryKey = queryKeys.assignees(taskId);

  const query = useQuery({
    queryKey,
    queryFn: () => AssigneesApi.list(taskId),
  });
  const add = useMutation({
    mutationFn: (exactEmail: string) => AssigneesApi.addByEmail(taskId, exactEmail),
    onSuccess: (created) => {
      queryClient.setQueryData<Atribuicao[]>(queryKey, (current = []) => [...current, created]);
    },
  });
  const remove = useMutation({
    mutationFn: (userId: number) => AssigneesApi.remove(taskId, userId),
    onSuccess: (_, userId) => {
      queryClient.setQueryData<Atribuicao[]>(queryKey, (current = []) =>
        current.filter((assignment) => assignment.usuario.id !== userId),
      );
    },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim();
    if (!normalized) return;
    setActionError(null);
    try {
      await add.mutateAsync(normalized);
      setEmail("");
    } catch (error) {
      setActionError(messageFrom(error));
    }
  }

  async function removeAssignee(userId: number) {
    setActionError(null);
    try {
      await remove.mutateAsync(userId);
    } catch (error) {
      setActionError(messageFrom(error));
    }
  }

  return (
    <section className={styles.relationSection}>
      <header className={styles.relationHeader}>
        <span className={styles.relationIcon}><UserRoundCheck aria-hidden="true" size={17} /></span>
        <div><h3>Responsáveis</h3><p>Pessoas atribuídas diretamente a esta tarefa.</p></div>
        {!!query.data?.length && <strong className={styles.sectionCount}>{query.data.length}</strong>}
      </header>

      {query.isPending ? (
        <div aria-label="Carregando responsáveis" className={styles.sectionLoading} role="status"><span /><span /></div>
      ) : query.isError ? (
        <div aria-label="Responsáveis indisponíveis" className={styles.sectionError} role="alert">
          <span>Não foi possível carregar os responsáveis.</span>
          <button onClick={() => void query.refetch()} type="button"><RotateCcw size={14} /> Tentar novamente</button>
        </div>
      ) : (
        <div className={styles.assigneeList}>
          {query.data?.map((assignment) => (
            <article className={styles.assigneeChip} key={assignment.id}>
              <span aria-hidden="true" className={styles.assigneeAvatar}>
                {initials(assignment.usuario.nome ?? "", assignment.usuario.email)}
              </span>
              <div><strong>{assignment.usuario.nome || "Usuário"}</strong><span>{assignment.usuario.email}</span></div>
              {owner && (
                <button aria-label={`Remover ${assignment.usuario.nome || assignment.usuario.email}`} disabled={remove.isPending} onClick={() => void removeAssignee(assignment.usuario.id)} type="button"><X size={14} /></button>
              )}
            </article>
          ))}
          {!query.data?.length && <p className={styles.relationEmpty}>Nenhum responsável atribuído.</p>}
        </div>
      )}

      {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}

      {owner && (
        <form className={styles.assigneeComposer} onSubmit={(event) => void submit(event)}>
          <label>
            <span className={styles.srOnly}>E-mail do responsável</span>
            <input aria-label="E-mail do responsável" autoComplete="email" onChange={(event) => setEmail(event.target.value)} placeholder="nome@dominio.com" type="email" value={email} />
          </label>
          <button disabled={add.isPending || !email.trim()} type="submit"><MailPlus size={15} /> Adicionar responsável</button>
        </form>
      )}
    </section>
  );
}
