import { Check, ListChecks, Plus, X } from "lucide-react";
import { forwardRef, useEffect, useRef, useState } from "react";

import type { ListaComTarefas, TarefaResumo } from "../../lib/api/types";
import { ListMenu } from "./ListMenu";
import type { TaskMove } from "./reorder";
import { SortableTaskCard } from "./SortableTaskCard";
import styles from "./board.module.css";

export interface KanbanColumnProps {
  list: ListaComTarefas;
  lists: ListaComTarefas[];
  isOnlyList: boolean;
  renameBusy: boolean;
  dragHandleRef?(element: HTMLButtonElement | null): void;
  dragging?: boolean;
  onDelete(list: ListaComTarefas): void;
  onRename(list: ListaComTarefas, name: string): Promise<boolean>;
  onCreateTask(list: ListaComTarefas): void;
  onDeleteTask(task: TarefaResumo): void;
  onOpenTask(task: TarefaResumo): void;
  onMoveTask(move: TaskMove): Promise<unknown>;
}

export const KanbanColumn = forwardRef<HTMLElement, KanbanColumnProps>(function KanbanColumn({
  list,
  lists,
  isOnlyList,
  renameBusy,
  dragHandleRef,
  dragging = false,
  onDelete,
  onRename,
  onCreateTask,
  onDeleteTask,
  onOpenTask,
  onMoveTask,
}, ref) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(list.nome);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  useEffect(() => setName(list.nome), [list.nome]);

  async function saveName() {
    const normalized = name.trim();
    if (!normalized || normalized === list.nome) {
      setName(list.nome);
      setRenaming(false);
      return;
    }
    if (await onRename(list, normalized)) setRenaming(false);
  }

  const taskCount = list.tarefas.length;

  return (
    <article className={`${styles.column} ${dragging ? styles.columnDragging : ""}`} data-list-id={list.id} ref={ref}>
      <header className={styles.columnHeader}>
        {renaming ? (
          <div className={styles.columnTitleRow}>
            <span className={styles.columnMarker} aria-hidden="true" />
            <div className={styles.renameField}>
              <label className={styles.visuallyHidden} htmlFor={`rename-list-${list.id}`}>
                Novo nome da lista
              </label>
              <input
                disabled={renameBusy}
                id={`rename-list-${list.id}`}
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void saveName();
                  if (event.key === "Escape") {
                    setName(list.nome);
                    setRenaming(false);
                  }
                }}
                ref={inputRef}
                value={name}
              />
              <button aria-label="Salvar nome" disabled={renameBusy || !name.trim()} onClick={() => void saveName()} type="button">
                <Check aria-hidden="true" size={16} />
              </button>
              <button aria-label="Cancelar renomeação" disabled={renameBusy} onClick={() => { setName(list.nome); setRenaming(false); }} type="button">
                <X aria-hidden="true" size={16} />
              </button>
            </div>
          </div>
        ) : (
          <button
            aria-label={`Arrastar lista ${list.nome}`}
            className={`${styles.columnTitleRow} ${styles.columnDragArea}`}
            ref={dragHandleRef}
            title="Arraste para mudar a ordem da lista"
            type="button"
          >
            <span className={styles.columnMarker} aria-hidden="true" />
            <h2>{list.nome}</h2>
          </button>
        )}
        {!renaming && (
          <div className={styles.columnActions}>
            <ListMenu
              deleteDisabled={isOnlyList}
              listName={list.nome}
              onDelete={() => onDelete(list)}
              onRename={() => setRenaming(true)}
            />
          </div>
        )}
      </header>
      <div className={styles.columnMeta}>
        <span>{taskCount} {taskCount === 1 ? "tarefa" : "tarefas"}</span>
      </div>
      <div className={styles.columnBody}>
        {taskCount === 0 ? (
          <div className={styles.emptyColumn}>
            <ListChecks aria-hidden="true" size={22} />
            <span>Nenhuma tarefa nesta lista</span>
          </div>
        ) : (
          <div className={styles.taskList}>
            {list.tarefas.map((task, index) => (
              <SortableTaskCard
                index={index}
                key={task.id}
                listId={list.id}
                lists={lists}
                onDelete={onDeleteTask}
                onMove={onMoveTask}
                onOpen={onOpenTask}
                task={task}
              />
            ))}
          </div>
        )}
        <button className={styles.addTaskButton} onClick={() => onCreateTask(list)} type="button">
          <Plus aria-hidden="true" size={16} /> Adicionar tarefa
        </button>
      </div>
    </article>
  );
});
