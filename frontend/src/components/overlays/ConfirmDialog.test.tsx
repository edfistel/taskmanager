import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("requires exact text for typed high-impact confirmation", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir quadro"
        description="Todos os dados serão removidos."
        level="typed"
        confirmationText="Projeto Website"
        confirmLabel="Excluir quadro"
        onClose={() => undefined}
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Excluir quadro" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByLabelText(/digite projeto website/i), "Projeto");
    expect(confirm).toBeDisabled();
    await user.clear(screen.getByLabelText(/digite projeto website/i));
    await user.type(
      screen.getByLabelText(/digite projeto website/i),
      "Projeto Website",
    );
    await user.click(confirm);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button type="button">Abrir</button>
        <ConfirmDialog
          open={false}
          title="Confirmar"
          description="Confirme a ação."
          level="standard"
          confirmLabel="Confirmar"
          onClose={onClose}
          onConfirm={() => undefined}
        />
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Abrir" });
    trigger.focus();
    rerender(
      <>
        <button type="button">Abrir</button>
        <ConfirmDialog
          open
          title="Confirmar"
          description="Confirme a ação."
          level="standard"
          confirmLabel="Confirmar"
          onClose={onClose}
          onConfirm={() => undefined}
        />
      </>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <>
        <button type="button">Abrir</button>
        <ConfirmDialog
          open={false}
          title="Confirmar"
          description="Confirme a ação."
          level="standard"
          confirmLabel="Confirmar"
          onClose={onClose}
          onConfirm={() => undefined}
        />
      </>,
    );
    expect(screen.getByRole("button", { name: "Abrir" })).toHaveFocus();
  });
});
