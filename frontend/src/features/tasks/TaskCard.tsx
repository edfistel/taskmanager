import { CalendarDays } from "lucide-react";
import { forwardRef, type ReactNode } from "react";

import type { StatusTarefa, TarefaResumo } from "../../lib/api/types";
import { formatApiDate } from "../../lib/date";
import styles from "./task.module.css";

const STATUS_LABELS: Record<StatusTarefa, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
};

interface TaskCardProps {
  task: TarefaResumo;
  onOpen(task: TarefaResumo): void;
  dragHandleRef?(element: HTMLButtonElement | null): void;
  dragging?: boolean;
  menuControl?: ReactNode;
  menuOpen?: boolean;
}

export const TaskCard = forwardRef<HTMLElement, TaskCardProps>(function TaskCard({
  task,
  onOpen,
  dragHandleRef,
  dragging = false,
  menuControl,
  menuOpen = false,
}, ref) {
  return (
    <article
      className={`${styles.taskCard} ${dragging ? styles.dragging : ""}`}
      data-menu-open={menuOpen || undefined}
      ref={ref}
    >
      <button
        aria-label={`Abrir tarefa ${task.titulo}`}
        className={styles.taskOpen}
        onClick={() => onOpen(task)}
        ref={dragHandleRef}
        title={dragHandleRef ? "Clique para abrir ou arraste para mover" : undefined}
        type="button"
      >
        <span className={styles.taskTitle}>{task.titulo}</span>
        <span className={styles.taskMeta}>
          <span className={`${styles.status} ${styles[`status_${task.status}`]}`}>
            <i aria-hidden="true" /> {STATUS_LABELS[task.status]}
          </span>
          {task.prazo && (
            <span className={styles.deadline}>
              <CalendarDays aria-hidden="true" size={14} /> {formatApiDate(task.prazo)}
            </span>
          )}
        </span>
      </button>
      {menuControl}
    </article>
  );
});
