import type { MinhaAtribuicao } from "../../lib/api/types";
import { authenticatedRequest } from "../../lib/auth/sessionManager";

export const AssignmentsApi = {
  mine: () => authenticatedRequest<MinhaAtribuicao[]>("/atribuicoes/minhas"),
};
