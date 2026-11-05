import { authenticatedRequest } from "../../lib/auth/sessionManager";
import type { Quadro, QuadroCriado } from "../../lib/api/types";
import type { JsonTransport } from "../../lib/api/transport";

export interface CreateBoardInput {
  nome: string;
  descricao?: string | null;
}

export interface UpdateBoardInput {
  nome?: string;
  descricao?: string | null;
}

export function createBoardsApi(transport: JsonTransport) {
  return {
    list: () => transport<Quadro[]>("/quadros"),
    get: (id: number) => transport<Quadro>(`/quadros/${id}`),
    create: (input: CreateBoardInput) =>
      transport<QuadroCriado>("/quadros", {
        method: "POST",
        json: input,
      }),
    update: (id: number, input: UpdateBoardInput) =>
      transport<Quadro>(`/quadros/${id}`, {
        method: "PUT",
        json: input,
      }),
    remove: async (id: number): Promise<void> => {
      await transport(`/quadros/${id}`, { method: "DELETE" });
    },
  };
}

export const BoardsApi = createBoardsApi(authenticatedRequest);
