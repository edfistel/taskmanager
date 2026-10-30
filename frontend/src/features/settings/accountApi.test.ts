import { describe, expect, it, vi } from "vitest";
import { authenticatedRequest } from "../../lib/auth/sessionManager";
import { AccountApi } from "./accountApi";

vi.mock("../../lib/auth/sessionManager", () => ({ authenticatedRequest: vi.fn() }));

describe("AccountApi", () => {
  it("reads the current profile and uses the server password contract", async () => {
    await AccountApi.profile();
    expect(authenticatedRequest).toHaveBeenCalledWith("/users/buscarMeuPerfil");
    await AccountApi.changePassword({ senhaAtual: "antiga123", novaSenha: "nova12345" });
    expect(authenticatedRequest).toHaveBeenCalledWith("/users/alterarSenha", { method: "PUT", json: { senhaAtual: "antiga123", novaSenha: "nova12345" } });
  });

  it("deletes the authenticated account without inventing body fields", async () => {
    await AccountApi.deleteAccount();
    expect(authenticatedRequest).toHaveBeenCalledWith("/users/apagarUsuario", { method: "DELETE" });
  });
});
