import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ListaComTarefas } from "../../lib/api/types";
import { KanbanColumn } from "./KanbanColumn";

describe("KanbanColumn", () => {
  it("uses the large list title area as the column drag handle", () => {
    const dragHandleRef = vi.fn();
    const list: ListaComTarefas = {
      id: 1,
      nome: "A Fazer",
      posicao: 0,
      quadroId: 7,
      tarefas: [],
    };

    render(
      <KanbanColumn
        dragHandleRef={dragHandleRef}
        isOnlyList={false}
        list={list}
        lists={[list]}
        onCreateTask={vi.fn()}
        onDelete={vi.fn()}
        onDeleteTask={vi.fn()}
        onMoveTask={vi.fn()}
        onOpenTask={vi.fn()}
        onRename={vi.fn()}
        renameBusy={false}
      />,
    );

    const titleHandle = screen.getByRole("button", { name: /arrastar lista a fazer/i });
    expect(titleHandle).toContainElement(screen.getByRole("heading", { name: "A Fazer" }));
    expect(dragHandleRef).toHaveBeenLastCalledWith(titleHandle);
    expect(screen.queryByRole("button", { name: /reordenar lista a fazer/i })).not.toBeInTheDocument();
  });
});
