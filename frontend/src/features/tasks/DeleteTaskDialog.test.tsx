import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TarefaResumo } from "../../lib/api/types";
import { DeleteTaskDialog } from "./DeleteTaskDialog";

describe("DeleteTaskDialog", () => {
  it("warns about every relation removed with the task", () => {
    const task: TarefaResumo = {
      id: 19,
      titulo: "Publicar página inicial",
      prazo: null,
      posicao: 0,
      status: "A_FAZER",
    };

    render(
      <DeleteTaskDialog
        busy={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        task={task}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: /excluir tarefa publicar página inicial/i });
    expect(within(dialog).getByText(/subtarefas, comentários e responsáveis também serão removidos/i)).toBeVisible();
  });
});
