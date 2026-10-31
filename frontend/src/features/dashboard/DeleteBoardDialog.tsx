import { ConfirmDialog } from "../../components/overlays/ConfirmDialog";
import type { Quadro } from "../../lib/api/types";

interface DeleteBoardDialogProps {
  board: Quadro | null;
  busy?: boolean;
  onClose(): void;
  onConfirm(): void;
}

export function DeleteBoardDialog({
  board,
  busy = false,
  onClose,
  onConfirm,
}: DeleteBoardDialogProps) {
  return (
    <ConfirmDialog
      busy={busy}
      confirmationText="Eu confirmo"
      confirmLabel="Excluir quadro"
      description="Esta ação apaga permanentemente as listas, tarefas, subtarefas, comentários e atribuições deste quadro."
      level="typed"
      onClose={onClose}
      onConfirm={onConfirm}
      open={Boolean(board)}
      title="Excluir quadro?"
    />
  );
}
