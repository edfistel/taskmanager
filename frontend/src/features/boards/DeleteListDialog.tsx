import { ConfirmDialog } from "../../components/overlays/ConfirmDialog";
import type { ListaComTarefas } from "../../lib/api/types";

interface DeleteListDialogProps {
  list: ListaComTarefas | null;
  busy: boolean;
  onClose(): void;
  onConfirm(): void;
}

export function DeleteListDialog({ list, busy, onClose, onConfirm }: DeleteListDialogProps) {
  return (
    <ConfirmDialog
      busy={busy}
      confirmLabel="Excluir lista"
      description="Todas as tarefas desta lista também serão excluídas. Esta ação não poderá ser desfeita."
      level="standard"
      onClose={onClose}
      onConfirm={onConfirm}
      open={list !== null}
      title={`Excluir lista ${list?.nome ?? ""}`}
    />
  );
}
