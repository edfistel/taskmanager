import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import styles from "./board.module.css";

interface ListMenuProps {
  listName: string;
  deleteDisabled: boolean;
  onDelete(): void;
  onRename(): void;
}

export function ListMenu({ listName, deleteDisabled, onDelete, onRename }: ListMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  return (
    <div className={styles.listMenu} ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opções da lista ${listName}`}
        className={styles.iconButton}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Ellipsis aria-hidden="true" size={19} />
      </button>
      {open && (
        <div className={styles.menuPanel} role="menu">
          <button
            onClick={() => {
              setOpen(false);
              onRename();
            }}
            role="menuitem"
            type="button"
          >
            <Pencil aria-hidden="true" size={16} /> Renomear lista
          </button>
          <button
            className={styles.deleteAction}
            disabled={deleteDisabled}
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            role="menuitem"
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} /> Excluir lista
          </button>
          {deleteDisabled && (
            <p className={styles.menuHint}>O quadro precisa ter ao menos uma lista</p>
          )}
        </div>
      )}
    </div>
  );
}
