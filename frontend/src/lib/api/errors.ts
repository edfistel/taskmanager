const MESSAGE_KEYS = ["message", "erro", "error"] as const;

export function extractApiMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;

  for (const key of MESSAGE_KEYS) {
    const value = Reflect.get(payload, key);
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return fallback;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, payload: unknown, message?: string) {
    super(
      message ??
        extractApiMessage(
          payload,
          "Não foi possível concluir a solicitação.",
        ),
    );
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
