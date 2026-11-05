import type { Usuario } from "../../lib/api/types";
import { authenticatedRequest } from "../../lib/auth/sessionManager";

export const AccountApi = {
  profile: () => authenticatedRequest<Usuario>("/users/buscarMeuPerfil"),
  changePassword: (input: { senhaAtual: string; novaSenha: string }) =>
    authenticatedRequest<void>("/users/alterarSenha", { method: "PUT", json: input }),
  deleteAccount: () => authenticatedRequest<void>("/users/apagarUsuario", { method: "DELETE" }),
};
