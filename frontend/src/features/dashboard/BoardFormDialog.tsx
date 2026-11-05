import { useEffect, useState, type FormEvent } from "react";

import { Modal } from "../../components/overlays/Modal";
import type { Quadro } from "../../lib/api/types";
import type { CreateBoardInput } from "./boardsApi";
import styles from "./dashboard.module.css";

interface BoardFormDialogProps {
  open: boolean;
  board?: Quadro | null;
  busy?: boolean;
  errorMessage?: string | null;
  onClose(): void;
  onSubmit(input: CreateBoardInput): Promise<void>;
}

export function BoardFormDialog({
  open,
  board,
  busy = false,
  errorMessage,
  onClose,
  onSubmit,
}: BoardFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(board?.nome ?? "");
    setDescription(board?.descricao ?? "");
    setLocalError(null);
  }, [board, open]);

  const isEditing = Boolean(board);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) {
      setLocalError("Informe um nome para o quadro.");
      return;
    }
    setLocalError(null);
    await onSubmit({
      nome: normalizedName,
      descricao: description.trim() || null,
    });
  }

  return (
    <Modal
      onClose={() => {
        if (!busy) onClose();
      }}
      open={open}
      title={isEditing ? "Editar quadro" : "Novo quadro"}
    >
      <form className={styles.boardForm} onSubmit={handleSubmit}>
        {!isEditing && (
          <p className={styles.formHint}>
            A lista “A Fazer” será criada automaticamente para você começar.
          </p>
        )}
        <label className={styles.field}>
          Nome do quadro
          <input
            autoComplete="off"
            disabled={busy}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Projeto Website"
            value={name}
          />
          <span>{name.length}/100</span>
        </label>
        <label className={styles.field}>
          Descrição (opcional)
          <textarea
            disabled={busy}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Qual é o objetivo deste quadro?"
            rows={4}
            value={description}
          />
        </label>
        {(localError || errorMessage) && (
          <p className={styles.formError} role="alert">
            {localError || errorMessage}
          </p>
        )}
        <div className={styles.formActions}>
          <button className={styles.secondaryButton} disabled={busy} onClick={onClose} type="button">
            Cancelar
          </button>
          <button className={styles.primaryButton} disabled={busy} type="submit">
            {busy ? "Salvando…" : isEditing ? "Salvar alterações" : "Criar quadro"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
