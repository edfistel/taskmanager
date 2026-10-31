import { describe, expect, it } from "vitest";

import { ApiError, extractApiMessage } from "./errors";

describe("API error normalization", () => {
  it.each([
    [{ message: "Quadro não encontrado" }, "Quadro não encontrado"],
    [{ erro: "Token inválido" }, "Token inválido"],
    [{ error: "Rota não encontrada" }, "Rota não encontrada"],
  ])("extracts supported backend messages from %j", (payload, expected) => {
    expect(extractApiMessage(payload, "Falha")).toBe(expected);
  });

  it("uses the fallback for malformed or empty payloads", () => {
    expect(extractApiMessage("<html>erro</html>", "Falha inesperada")).toBe(
      "Falha inesperada",
    );
    expect(extractApiMessage({}, "Falha inesperada")).toBe(
      "Falha inesperada",
    );
  });

  it("retains status and payload in ApiError", () => {
    const payload = { message: "Sem permissão" };
    const error = new ApiError(403, payload, "Sem permissão");

    expect(error).toMatchObject({
      name: "ApiError",
      status: 403,
      payload,
      message: "Sem permissão",
    });
  });
});
