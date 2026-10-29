import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Lista } from "../../lib/api/types";
import { TaskCreateDialog } from "./TaskCreateDialog";

const list: Lista = { id: 4, nome: "Em Andamento", posicao: 1, quadroId: 7 };

describe("TaskCreateDialog", () => {
  it("submits the backend-supported fields with an unchanged native date", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    render(
      <TaskCreateDialog
        busy={false}
        list={list}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        open
      />,
    );

    expect(
      screen.getByText((_, element) =>
        element?.tagName === "P" &&
        /será adicionada ao final de em andamento/i.test(element.textContent ?? ""),
      ),
    ).toBeVisible();
    await user.type(screen.getByLabelText(/título da tarefa/i), "Publicar página inicial");
    await user.type(screen.getByLabelText(/descrição.*opcional/i), "Validar conteúdo final");
    await user.type(screen.getByLabelText(/prazo.*opcional/i), "2026-11-02");
    await user.selectOptions(screen.getByLabelText(/status inicial/i), "EM_ANDAMENTO");
    await user.click(screen.getByRole("button", { name: /^criar tarefa$/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      titulo: "Publicar página inicial",
      descricao: "Validar conteúdo final",
      prazo: "2026-11-02",
      status: "EM_ANDAMENTO",
    });
  });

  it("sends null when optional text and deadline are empty", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);

    render(
      <TaskCreateDialog
        busy={false}
        list={list}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        open
      />,
    );

    await user.type(screen.getByLabelText(/título da tarefa/i), "Tarefa sem prazo");
    await user.click(screen.getByRole("button", { name: /^criar tarefa$/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      titulo: "Tarefa sem prazo",
      descricao: null,
      prazo: null,
      status: "A_FAZER",
    });
  });
});
