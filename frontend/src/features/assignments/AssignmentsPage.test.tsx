import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssignmentsPage } from "./AssignmentsPage";
import { AssignmentsApi } from "./assignmentsApi";

vi.mock("./assignmentsApi", () => ({ AssignmentsApi: { mine: vi.fn() } }));

function show() {
  return render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><AssignmentsPage /></QueryClientProvider>);
}
const items = [{ atribuidoEm: "2026-10-30T12:00:00Z", tarefa: { id: 8, titulo: "Revisar portal", status: "A_FAZER", prazo: null, lista: { id: 2, nome: "Entrada", quadro: { id: 1, nome: "Website" } } } }];

describe("Minhas atribuições", () => {
  it("lists assignments and filters locally without linking to private boards", async () => {
    vi.mocked(AssignmentsApi.mine).mockResolvedValue(items as Awaited<ReturnType<typeof AssignmentsApi.mine>>);
    show();
    expect(await screen.findByRole("button", { name: /revisar portal/i })).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    await userEvent.type(screen.getByRole("searchbox"), "inexistente");
    expect(screen.getByText("Nenhuma tarefa encontrada")).toBeVisible();
    expect(AssignmentsApi.mine).toHaveBeenCalledTimes(1);
  });
  it("shows an empty state", async () => {
    vi.mocked(AssignmentsApi.mine).mockResolvedValue([]);
    show();
    expect(await screen.findByText("Nenhuma tarefa atribuída")).toBeVisible();
  });
  it("combines status, board and due filters without new requests", async () => {
    vi.mocked(AssignmentsApi.mine).mockResolvedValue([
      items[0],
      { ...items[0], tarefa: { ...items[0].tarefa, id: 9, titulo: "Publicar site", status: "CONCLUIDO", prazo: "2099-12-01", lista: { id: 3, nome: "Entrega", quadro: { id: 2, nome: "Marketing" } } } },
    ] as Awaited<ReturnType<typeof AssignmentsApi.mine>>);
    show();
    expect(await screen.findByRole("button", { name: /publicar site/i })).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText("Status"), "CONCLUIDO");
    expect(screen.queryByRole("button", { name: /revisar portal/i })).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Quadro"), "2");
    await userEvent.selectOptions(screen.getByLabelText("Prazo"), "Sem prazo");
    expect(screen.getByText("Nenhuma tarefa encontrada")).toBeVisible();
    await userEvent.selectOptions(screen.getByLabelText("Prazo"), "Próximas");
    expect(screen.getByRole("button", { name: /publicar site/i })).toBeVisible();
    expect(AssignmentsApi.mine).toHaveBeenCalledTimes(1);
  });
  it("offers retry on a failed request", async () => {
    vi.mocked(AssignmentsApi.mine).mockRejectedValue(new Error("offline"));
    show();
    expect(await screen.findByRole("button", { name: "Tentar novamente" })).toBeVisible();
  });
});
