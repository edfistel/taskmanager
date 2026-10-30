import { ConfirmDialog } from "../../components/overlays/ConfirmDialog";

interface Props { busy: boolean; onClose(): void; onConfirm(): void }
export function DeleteAccountDialog({ busy, onClose, onConfirm }: Props) {
  return <ConfirmDialog open title="Excluir minha conta" level="typed" confirmationText="EXCLUIR" confirmLabel="Excluir definitivamente" busy={busy} onClose={() => { if (!busy) onClose(); }} onConfirm={onConfirm} description="Sua conta e os dados associados serão excluídos permanentemente. Esta ação não pode ser desfeita." />;
}
