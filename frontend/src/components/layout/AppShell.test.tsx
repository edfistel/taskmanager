import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";
import { AuthContext } from "../../lib/auth/AuthProvider";
import { AppShell } from "./AppShell";

function showShell() {
  return render(<MemoryRouter><AuthContext.Provider value={{
    status: "authenticated", user: { id: 1, nome: "Ana", email: "ana@example.test" },
    login: async () => { throw new Error("unused"); }, register: async () => { throw new Error("unused"); }, logout: async () => undefined,
  }}><AppShell title="Painel">Conteúdo</AppShell></AuthContext.Provider></MemoryRouter>);
}

describe("collapsible sidebar", () => {
  beforeEach(() => localStorage.clear());

  it("toggles labels and brand while preserving named links and the logo", async () => {
    showShell();
    expect(screen.getByText("TaskFlow")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Recolher menu lateral" }));
    expect(screen.queryByText("TaskFlow")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Logo TaskFlow" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Visão geral" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Minhas atribuições")).not.toBeVisible();
    const expand = screen.getByRole("button", { name: "Expandir menu lateral" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expand.focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByText("TaskFlow")).toBeVisible();
    expect(screen.getByText("Minhas atribuições")).toBeVisible();
    expect(screen.getByRole("button", { name: "Recolher menu lateral" })).toHaveAttribute("aria-expanded", "true");
  });

  it("restores the chosen state when another page mounts", async () => {
    const view = showShell();
    await userEvent.click(screen.getByRole("button", { name: "Recolher menu lateral" }));
    view.unmount();
    showShell();
    expect(screen.getByRole("button", { name: "Expandir menu lateral" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("TaskFlow")).not.toBeInTheDocument();
  });
});
