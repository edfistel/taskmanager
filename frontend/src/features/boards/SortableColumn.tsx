import { CollisionPriority } from "@dnd-kit/abstract";
import { SortableKeyboardPlugin } from "@dnd-kit/dom/sortable";
import { useSortable } from "@dnd-kit/react/sortable";

import { KanbanColumn, type KanbanColumnProps } from "./KanbanColumn";

interface SortableColumnProps extends Omit<KanbanColumnProps, "dragHandleRef" | "dragging"> {
  index: number;
}

export function SortableColumn({ index, list, ...props }: SortableColumnProps) {
  const { ref, handleRef, isDragging } = useSortable({
    id: `list-${list.id}`,
    index,
    group: "board-lists",
    type: "list",
    accept: ["list", "task"],
    collisionPriority: CollisionPriority.Low,
    data: { kind: "list", listId: list.id, index },
    plugins: [SortableKeyboardPlugin],
  });

  return (
    <KanbanColumn
      {...props}
      dragHandleRef={(element) => handleRef(element)}
      dragging={isDragging}
      list={list}
      ref={(element) => ref(element)}
    />
  );
}
