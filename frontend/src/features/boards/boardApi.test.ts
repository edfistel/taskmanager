import { describe, expect, it, vi } from "vitest";

import type { JsonTransport } from "../../lib/api/transport";
import { createBoardApi } from "./boardApi";

describe("BoardApi", () => {
  it("maps list operations to the backend routes and supported fields", async () => {
    const transport = vi.fn().mockResolvedValue(undefined) as unknown as JsonTransport;
    const api = createBoardApi(transport);

    await api.listLists(7);
    await api.createList(7, "Revisão");
    await api.renameList(3, "Em validação");
    await api.moveList(3, 1);
    await api.removeList(3);

    expect(transport).toHaveBeenNthCalledWith(1, "/quadros/7/listas");
    expect(transport).toHaveBeenNthCalledWith(2, "/quadros/7/listas", {
      method: "POST",
      json: { nome: "Revisão" },
    });
    expect(transport).toHaveBeenNthCalledWith(3, "/listas/3", {
      method: "PUT",
      json: { nome: "Em validação" },
    });
    expect(transport).toHaveBeenNthCalledWith(4, "/listas/3/mover", {
      method: "PATCH",
      json: { posicao: 1 },
    });
    expect(transport).toHaveBeenNthCalledWith(5, "/listas/3", {
      method: "DELETE",
    });
  });
});
