import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TarefaResumo } from "../../lib/api/types";
import { TaskCard } from "./TaskCard";

describe("TaskCard", () => {
  it("raises the task above neighboring cards while its action menu is open", () => {
    const task: TarefaResumo = {
      id: 7,
      titulo: "Tarefa com menu aberto",
      prazo: null,
      posicao: 0,
      status: "A_FAZER",
    };
    render(
      <TaskCard
        menuOpen
        onOpen={vi.fn()}
        task={task}
      />,
    );

    expect(screen.getByRole("article")).toHaveAttribute("data-menu-open", "true");
  });

  it("renders only summary fields and opens the selected task", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const task = {
      id: 19,
      titulo: "Publicar página inicial",
      prazo: "2026-11-02T00:00:00.000Z",
      posicao: 0,
      status: "EM_ANDAMENTO",
      descricao: "Descrição interna que só pertence ao detalhe",
      progressoSubtarefas: "2 de 4 subtarefas",
    } as TarefaResumo & { descricao: string; progressoSubtarefas: string };

    render(<TaskCard onOpen={onOpen} task={task} />);

    expect(screen.getByText("Publicar página inicial")).toBeVisible();
    expect(screen.getByText("Em andamento")).toBeVisible();
    expect(screen.getByText("02/11/2026")).toBeVisible();
    expect(screen.queryByText(/descrição interna/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2 de 4 subtarefas/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /abrir tarefa publicar página inicial/i }));
    expect(onOpen).toHaveBeenCalledWith(task);
  });

  it("uses the task body as the mouse drag handle without replacing its open action", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const dragHandleRef = vi.fn();
    const task: TarefaResumo = {
      id: 23,
      titulo: "Ajustar experiência de arraste",
      prazo: null,
      posicao: 0,
      status: "A_FAZER",
    };

    render(
      <TaskCard
        dragHandleRef={dragHandleRef}
        onOpen={onOpen}
        task={task}
      />,
    );

    const taskBody = screen.getByRole("button", {
      name: /abrir tarefa ajustar experiência de arraste/i,
    });
    expect(dragHandleRef).toHaveBeenLastCalledWith(taskBody);
    expect(screen.queryByRole("button", { name: /arrastar tarefa/i })).not.toBeInTheDocument();

    await user.click(taskBody);
    expect(onOpen).toHaveBeenCalledWith(task);
  });
});
