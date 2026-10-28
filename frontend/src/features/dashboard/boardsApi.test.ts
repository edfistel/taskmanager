import { describe, expect, it, vi } from "vitest";

import type { JsonTransport, RequestJsonOptions } from "../../lib/api/transport";
import { createBoardsApi } from "./boardsApi";

describe("BoardsApi", () => {
  it("maps the board lifecycle to the backend routes without adding fields", async () => {
    const calls: Array<{ path: string; options?: RequestJsonOptions }> = [];
    const transport: JsonTransport = vi.fn(async (path, options) => {
      calls.push({ path, options });
      return undefined as never;
    });
    const api = createBoardsApi(transport);

    await api.list();
    await api.get(7);
    await api.create({ nome: "Produto", descricao: "Roadmap do time" });
    await api.update(7, { nome: "Produto 2027", descricao: null });
    await api.remove(7);

    expect(calls).toEqual([
      { path: "/quadros", options: undefined },
      { path: "/quadros/7", options: undefined },
      {
        path: "/quadros",
        options: {
          method: "POST",
          json: { nome: "Produto", descricao: "Roadmap do time" },
        },
      },
      {
        path: "/quadros/7",
        options: {
          method: "PUT",
          json: { nome: "Produto 2027", descricao: null },
        },
      },
      { path: "/quadros/7", options: { method: "DELETE" } },
    ]);
  });
});
