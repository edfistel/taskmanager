import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquareText, Pencil, RotateCcw, Send, X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { queryKeys } from "../../lib/api/queryKeys";
import type { Comentario } from "../../lib/api/types";
import { CompactDelete } from "./CompactDelete";
import { CommentsApi } from "./commentsApi";
import styles from "./task.module.css";

interface CommentSectionProps {
  taskId: number;
  mode: "owner" | "collaborator";
  currentUserId: number;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível atualizar os comentários.";
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) ?? "?").toUpperCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function CommentSection({ taskId, mode, currentUserId }: CommentSectionProps) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const queryKey = queryKeys.comments(taskId);

  const query = useQuery({
    queryKey,
    queryFn: () => CommentsApi.list(taskId),
  });
  const create = useMutation({
    mutationFn: (newText: string) => CommentsApi.create(taskId, newText),
    onSuccess: (created) => {
      queryClient.setQueryData<Comentario[]>(queryKey, (current = []) => [...current, created]);
    },
  });
  const update = useMutation({
    mutationFn: ({ id, newText }: { id: number; newText: string }) => CommentsApi.update(id, newText),
    onSuccess: (updated) => {
      queryClient.setQueryData<Comentario[]>(queryKey, (current = []) =>
        current.map((comment) => comment.id === updated.id ? updated : comment),
      );
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => CommentsApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<Comentario[]>(queryKey, (current = []) =>
        current.filter((comment) => comment.id !== id),
      );
    },
  });

  async function submitNew(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = text.trim();
    if (!normalized) return;
    setActionError(null);
    try {
      await create.mutateAsync(normalized);
      setText("");
    } catch (error) {
      setActionError(messageFrom(error));
    }
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault();
    const normalized = editingText.trim();
    if (!normalized) return;
    setActionError(null);
    try {
      await update.mutateAsync({ id, newText: normalized });
      setEditingId(null);
      setEditingText("");
    } catch (error) {
      setActionError(messageFrom(error));
    }
  }

  return (
    <section className={styles.relationSection}>
      <header className={styles.relationHeader}>
        <span className={styles.relationIcon}><MessageSquareText aria-hidden="true" size={17} /></span>
        <div><h3>Comentários</h3><p>Centralize decisões e atualizações da equipe.</p></div>
        {!!query.data?.length && <strong className={styles.sectionCount}>{query.data.length}</strong>}
      </header>

      {query.isPending ? (
        <div aria-label="Carregando comentários" className={styles.sectionLoading} role="status"><span /><span /></div>
      ) : query.isError ? (
        <div aria-label="Comentários indisponíveis" className={styles.sectionError} role="alert">
          <span>Comentários indisponíveis no momento.</span>
          <button onClick={() => void query.refetch()} type="button"><RotateCcw size={14} /> Tentar novamente</button>
        </div>
      ) : (
        <>
          <ul className={styles.commentList}>
            {query.data?.map((comment) => {
              const own = comment.usuarioId === currentUserId;
              const canDelete = own || mode === "owner";
              return (
                <li className={styles.commentItem} key={comment.id}>
                  <span aria-hidden="true" className={styles.commentAvatar}>{initials(comment.usuario.nome || "Usuário")}</span>
                  <div className={styles.commentBody}>
                    <div className={styles.commentMeta}>
                      <strong>{comment.usuario.nome || "Usuário"}</strong>
                      <time dateTime={comment.criadoEm}>{formatDate(comment.criadoEm)}</time>
                    </div>
                    {editingId === comment.id ? (
                      <form className={styles.commentEdit} onSubmit={(event) => void submitEdit(event, comment.id)}>
                        <label>
                          <span className={styles.srOnly}>Editar comentário</span>
                          <textarea aria-label="Editar comentário" autoFocus maxLength={2000} onChange={(event) => setEditingText(event.target.value)} value={editingText} />
                        </label>
                        <div>
                          <button aria-label="Salvar comentário" className={styles.iconButtonSuccess} disabled={update.isPending} type="submit"><Check size={15} /></button>
                          <button aria-label="Cancelar edição" className={styles.iconButton} onClick={() => setEditingId(null)} type="button"><X size={15} /></button>
                        </div>
                      </form>
                    ) : <p>{comment.texto}</p>}
                  </div>
                  {editingId !== comment.id && (own || canDelete) && (
                    <div className={styles.commentActions} style={{ opacity: 1 }}>
                      {own && <button aria-label={`Editar comentário de ${comment.usuario.nome}`} className={styles.iconButton} onClick={() => { setEditingId(comment.id); setEditingText(comment.texto); }} type="button"><Pencil size={14} /></button>}
                      {canDelete && <CompactDelete disabled={remove.isPending} label={`Excluir comentário de ${comment.usuario.nome}`} onConfirm={() => remove.mutateAsync(comment.id)} question={`Excluir o comentário de ${comment.usuario.nome}?`} />}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {!query.data?.length && <p className={styles.relationEmpty}>Nenhum comentário ainda. Inicie a conversa.</p>}
        </>
      )}

      {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}

      <form className={styles.commentComposer} onSubmit={(event) => void submitNew(event)}>
        <label>
          <span className={styles.srOnly}>Escrever comentário</span>
          <textarea aria-label="Escrever comentário" maxLength={2000} onChange={(event) => setText(event.target.value)} placeholder="Compartilhe uma atualização..." value={text} />
        </label>
        <div><small>{text.length}/2000</small><button disabled={create.isPending || !text.trim()} type="submit"><Send size={15} /> Comentar</button></div>
      </form>
    </section>
  );
}
