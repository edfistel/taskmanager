import { ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { Drawer } from "../../components/overlays/Drawer";
import type { AtualizarTarefaInput } from "../../lib/api/types";
import { useAuth } from "../../lib/auth/useAuth";
import { AssigneeSection } from "./AssigneeSection";
import { CommentSection } from "./CommentSection";
import { DeleteTaskDialog } from "./DeleteTaskDialog";
import { SubtaskSection } from "./SubtaskSection";
import { TaskFields } from "./TaskFields";
import {
  useDeleteTaskFromDetails,
  useTaskDetails,
  useUpdateTask,
} from "./useTasks";
import styles from "./task.module.css";

interface TaskDetailsDrawerProps {
  taskId: number | null;
  mode: "owner" | "collaborator";
  onClose(): void;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir esta ação.";
}

export function TaskDetailsDrawer({ taskId, mode, onClose }: TaskDetailsDrawerProps) {
  const { user } = useAuth();
  const editable = mode === "owner";
  const detailsQuery = useTaskDetails(taskId, editable);
  const updateTask = useUpdateTask(taskId);
  const deleteTask = useDeleteTaskFromDetails(taskId);
  const { showToast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const task = detailsQuery.data;

  async function save(input: AtualizarTarefaInput): Promise<boolean> {
    try {
      await updateTask.mutateAsync(input);
      showToast("Detalhes da tarefa atualizados.", "success");
      return true;
    } catch (error) {
      showToast(messageFrom(error), "error");
      return false;
    }
  }

  async function remove() {
    try {
      await deleteTask.mutateAsync();
      setConfirmDelete(false);
      showToast("Tarefa e seus vínculos foram excluídos.", "success");
      onClose();
    } catch (error) {
      showToast(messageFrom(error), "error");
    }
  }

  return (
    <>
      <Drawer onClose={onClose} open={taskId !== null} title="Detalhes da tarefa">
        {taskId !== null && (
          <div className={styles.detailsContent}>
            {editable ? (
              detailsQuery.isPending ? (
                <div aria-label="Carregando detalhes da tarefa" className={styles.detailsLoading} role="status">
                  <span /><span /><span /><span />
                </div>
              ) : detailsQuery.isError ? (
                <ErrorState
                  description="Os dados completos desta tarefa não foram carregados. As áreas de colaboração continuam independentes."
                  onRetry={() => void detailsQuery.refetch()}
                  title="Não foi possível carregar a tarefa"
                />
              ) : task ? (
            <TaskFields
              busy={updateTask.isPending}
              editable={editable}
              onSubmit={save}
              task={task}
            />
              ) : null
            ) : (
              <div className={styles.collaboratorNotice}>
                <ShieldCheck aria-hidden="true" size={18} />
                <div><strong>Modo colaborador</strong><p>Você pode acompanhar responsáveis, concluir subtarefas e participar dos comentários.</p></div>
              </div>
            )}

            <SubtaskSection mode={mode} taskId={taskId} />
            <CommentSection currentUserId={user?.id ?? 0} mode={mode} taskId={taskId} />
            <AssigneeSection mode={mode} taskId={taskId} />

            {editable && task && (
              <section className={styles.dangerZone}>
                <div><strong>Excluir tarefa</strong><p>Remove também todos os vínculos desta tarefa.</p></div>
                <button onClick={() => setConfirmDelete(true)} type="button">
                  <Trash2 aria-hidden="true" size={16} /> Excluir tarefa
                </button>
              </section>
            )}
          </div>
        )}
      </Drawer>
      <DeleteTaskDialog
        busy={deleteTask.isPending}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
        task={confirmDelete ? task ?? null : null}
      />
    </>
  );
}
