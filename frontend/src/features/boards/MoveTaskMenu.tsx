import { ArrowRight, Eye, MoreHorizontal, MoveRight, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ListaComTarefas, TarefaResumo } from "../../lib/api/types";
import type { TaskMove } from "./reorder";
import styles from "./board.module.css";

interface MoveTaskMenuProps {
  task: TarefaResumo;
  lists: ListaComTarefas[];
  onDelete(task: TarefaResumo): void;
  onMove(move: TaskMove): Promise<unknown>;
  onOpen(task: TarefaResumo): void;
  onOpenChange?(open: boolean): void;
}

export function MoveTaskMenu({ task, lists, onDelete, onMove, onOpen, onOpenChange }: MoveTaskMenuProps) {
  const currentList = useMemo(
    () => lists.find((list) => list.tarefas.some((item) => item.id === task.id)),
    [lists, task.id],
  );
  const [open, setOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const [targetListId, setTargetListId] = useState(currentList?.id ?? lists[0]?.id ?? 0);
  const [position, setPosition] = useState(task.posicao);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const targetList = lists.find((list) => list.id === targetListId);
  const positionCount = Math.max(
    1,
    (targetList?.tarefas.length ?? 0) + (targetListId === currentList?.id ? 0 : 1),
  );

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setMoving(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (position >= positionCount) setPosition(positionCount - 1);
  }, [position, positionCount]);

  if (!currentList) return null;

  async function submit() {
    if (!currentList) return;
    setBusy(true);
    try {
      await onMove({
        taskId: task.id,
        fromListId: currentList.id,
        toListId: targetListId,
        toIndex: position,
      });
      setOpen(false);
      setMoving(false);
    } catch {
      // The shared movement mutation already restores state and reports the error.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.moveTaskMenu} ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Opções da tarefa ${task.titulo}`}
        className={styles.taskActionButton}
        onClick={() => {
          setOpen((current) => !current);
          setMoving(false);
        }}
        title="Opções da tarefa"
        type="button"
      >
        <MoreHorizontal aria-hidden="true" size={17} />
      </button>
      {open && !moving && (
        <div aria-label={`Opções de ${task.titulo}`} className={`${styles.menuPanel} ${styles.taskMenuPanel}`} role="menu">
          <button onClick={() => { setOpen(false); onOpen(task); }} role="menuitem" type="button">
            <Eye aria-hidden="true" size={15} /> Abrir detalhes
          </button>
          <button onClick={() => setMoving(true)} role="menuitem" type="button">
            <MoveRight aria-hidden="true" size={15} /> Mover para…
          </button>
          <button className={styles.deleteAction} onClick={() => { setOpen(false); onDelete(task); }} role="menuitem" type="button">
            <Trash2 aria-hidden="true" size={15} /> Excluir tarefa
          </button>
        </div>
      )}
      {open && moving && (
        <div aria-label={`Mover ${task.titulo}`} className={styles.movePanel} role="dialog">
          <header>
            <strong>Mover para…</strong>
            <button aria-label="Fechar movimentação" onClick={() => { setOpen(false); setMoving(false); }} type="button">
              <X aria-hidden="true" size={15} />
            </button>
          </header>
          <label>
            <span>Lista de destino</span>
            <select
              disabled={busy}
              onChange={(event) => {
                setTargetListId(Number(event.target.value));
                setPosition(0);
              }}
              value={targetListId}
            >
              {lists.map((list) => (
                <option key={list.id} value={list.id}>{list.nome}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Posição</span>
            <select
              disabled={busy}
              onChange={(event) => setPosition(Number(event.target.value))}
              value={position}
            >
              {Array.from({ length: positionCount }, (_, index) => (
                <option key={index} value={index}>
                  {index + 1}{index === 0 ? " — início" : index === positionCount - 1 ? " — final" : ""}
                </option>
              ))}
            </select>
          </label>
          <button className={styles.moveConfirmButton} disabled={busy} onClick={() => void submit()} type="button">
            <ArrowRight aria-hidden="true" size={16} /> {busy ? "Movendo…" : "Mover tarefa"}
          </button>
        </div>
      )}
    </div>
  );
}
