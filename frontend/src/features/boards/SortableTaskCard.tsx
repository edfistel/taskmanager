import { CollisionPriority } from "@dnd-kit/abstract";
import { SortableKeyboardPlugin } from "@dnd-kit/dom/sortable";
import { useSortable } from "@dnd-kit/react/sortable";
import { useState } from "react";

import type { ListaComTarefas, TarefaResumo } from "../../lib/api/types";
import { TaskCard } from "../tasks/TaskCard";
import { MoveTaskMenu } from "./MoveTaskMenu";
import type { TaskMove } from "./reorder";

interface SortableTaskCardProps {
  task: TarefaResumo;
  listId: number;
  index: number;
  lists: ListaComTarefas[];
  onDelete(task: TarefaResumo): void;
  onOpen(task: TarefaResumo): void;
  onMove(move: TaskMove): Promise<unknown>;
}

export function SortableTaskCard({
  task,
  listId,
  index,
  lists,
  onDelete,
  onOpen,
  onMove,
}: SortableTaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { ref, handleRef, isDragging } = useSortable({
    id: `task-${task.id}`,
    index,
    group: `list-${listId}`,
    type: "task",
    accept: "task",
    collisionPriority: CollisionPriority.Highest,
    data: { kind: "task", taskId: task.id, listId, index },
    plugins: [SortableKeyboardPlugin],
  });

  return (
    <TaskCard
      dragHandleRef={(element) => handleRef(element)}
      dragging={isDragging}
      menuControl={(
        <MoveTaskMenu
          lists={lists}
          onDelete={onDelete}
          onMove={onMove}
          onOpen={onOpen}
          onOpenChange={setMenuOpen}
          task={task}
        />
      )}
      menuOpen={menuOpen}
      onOpen={onOpen}
      ref={(element) => ref(element)}
      task={task}
    />
  );
}
