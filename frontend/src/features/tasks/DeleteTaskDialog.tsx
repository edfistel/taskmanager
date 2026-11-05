import { ConfirmDialog } from "../../components/overlays/ConfirmDialog";
import type { TarefaResumo } from "../../lib/api/types";

interface DeleteTaskDialogProps {
  task: TarefaResumo | null;
  busy: boolean;
  onClose(): void;
  onConfirm(): void;
}

export function DeleteTaskDialog({ task, busy, onClose, onConfirm }: DeleteTaskDialogProps) {
  return (
    <ConfirmDialog
      busy={busy}
      confirmLabel="Excluir tarefa"
      description="As subtarefas, comentários e responsáveis também serão removidos. Esta ação não poderá ser desfeita."
      level="standard"
      onClose={onClose}
      onConfirm={onConfirm}
      open={task !== null}
      title={`Excluir tarefa ${task?.titulo ?? ""}`}
    />
  );
}
