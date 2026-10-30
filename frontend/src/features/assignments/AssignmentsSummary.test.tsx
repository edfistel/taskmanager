import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { queryKeys } from "../../lib/api/queryKeys";
import type { MinhaAtribuicao } from "../../lib/api/types";
import { AssignmentsApi } from "./assignmentsApi";
import { AssignmentsSummary } from "./AssignmentsSummary";

vi.mock("./assignmentsApi", () => ({ AssignmentsApi: { mine: vi.fn() } }));
const items: MinhaAtribuicao[] = [1, 2, 3, 4].map((id) => ({
  atribuidoEm: `2026-10-${20 + id}T12:00:00Z`,
  tarefa: { id, titulo: `Entrega ${id}`, status: id === 4 ? "CONCLUIDO" : "A_FAZER", prazo: null, lista: { id: 1, nome: "Entrada", quadro: { id: 7, nome: "Privado" } } },
}));

function show(client = new QueryClient({ defaultOptions: { queries: { retry: false } } })) {
  render(<QueryClientProvider client={client}><MemoryRouter><AssignmentsSummary /></MemoryRouter></QueryClientProvider>);
  return client;
}

beforeEach(() => { vi.clearAllMocks(); });

describe("AssignmentsSummary", () => {
  it("counts the real assignments and previews only the three most recently assigned", async () => {
    vi.mocked(AssignmentsApi.mine).mockResolvedValue(items);
    const client = show();
    expect(await screen.findByText("4 tarefas atribuídas")).toBeVisible();
    expect(screen.getByText("Pendentes: 3 · Concluídas: 1")).toBeVisible();
    const rows = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.textContent)).toEqual(["Entrega 4", "Entrega 3", "Entrega 2"]);
    expect(screen.queryByText("Entrega 1")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Ver minhas tarefas" })).toHaveAttribute("href", "/atribuicoes");
    expect(client.getQueryData(queryKeys.assignments)).toEqual(items);
    expect(AssignmentsApi.mine).toHaveBeenCalledOnce();
  });

  it("keeps a pending request honest instead of displaying zero counts", () => {
    vi.mocked(AssignmentsApi.mine).mockReturnValue(new Promise(() => undefined));
    show();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando atribuições…");
    expect(screen.queryByText(/tarefas atribuídas/)).not.toBeInTheDocument();
  });

  it("shows an honest empty state", async () => {
    vi.mocked(AssignmentsApi.mine).mockResolvedValue([]);
    show();
    expect(await screen.findByText("Nenhuma tarefa atribuída por enquanto.")).toBeVisible();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("offers a retry after a failed request", async () => {
    vi.mocked(AssignmentsApi.mine).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(items.slice(0, 1));
    show();
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar suas atribuições.");
    await userEvent.click(screen.getByRole("button", { name: "Recarregar atribuições" }));
    await waitFor(() => expect(screen.getByText("1 tarefa atribuída")).toBeVisible());
    expect(AssignmentsApi.mine).toHaveBeenCalledTimes(2);
  });
});
