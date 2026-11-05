import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";

describe("stacked dialogs", () => {
  it("closes only the top dialog with Escape", async () => {
    const closeParent = vi.fn();
    const closeChild = vi.fn();
    render(<><Modal open title="Tarefa" onClose={closeParent}><button>Editar</button></Modal><Modal open title="Confirmar" onClose={closeChild}><button>Excluir</button></Modal></>);
    await userEvent.keyboard("{Escape}");
    expect(closeChild).toHaveBeenCalledTimes(1);
    expect(closeParent).not.toHaveBeenCalled();
  });

  it("keeps focus inside the top dialog and restores scroll when all dialogs close", async () => {
    document.body.style.overflow = "auto";
    const view = render(<Modal open title="Detalhes" onClose={() => undefined}><button>Última ação</button></Modal>);
    expect(document.body.style.overflow).toBe("hidden");
    screen.getByRole("button", { name: "Última ação" }).focus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Fechar" })).toHaveFocus();
    view.unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});
