import { ApiError, isApiError } from "./errors";

export interface RequestJsonOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  json?: unknown;
}

export type JsonTransport = <T>(
  path: string,
  options?: RequestJsonOptions,
) => Promise<T>;

export interface SessionPort {
  getAccessToken(): string | null;
  refresh(): Promise<string | null>;
  expire(): void;
}

interface ApiEnvelope<T> {
  success: boolean;
  body?: T;
}

function isApiEnvelope<T>(payload: unknown): payload is ApiEnvelope<T> {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "success" in payload &&
      typeof Reflect.get(payload, "success") === "boolean",
  );
}

async function parseResponse(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const text = await response.text();
    return text || undefined;
  }

  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

export const requestJson: JsonTransport = async <T>(
  path: string,
  options: RequestJsonOptions = {},
): Promise<T> => {
  const { json, headers: suppliedHeaders, ...requestOptions } = options;
  const headers = new Headers(suppliedHeaders);
  headers.set("Accept", "application/json");

  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, {
    ...requestOptions,
    headers,
    body: json === undefined ? requestOptions.body : JSON.stringify(json),
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  if (isApiEnvelope<T>(payload) && "body" in payload) {
    return payload.body as T;
  }

  return payload as T;
};

function withAccessToken(
  options: RequestJsonOptions,
  accessToken: string | null,
): RequestJsonOptions {
  const headers = new Headers(options.headers);
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  else headers.delete("Authorization");
  return { ...options, headers };
}

export function createAuthenticatedTransport(
  base: JsonTransport,
  session: SessionPort,
): JsonTransport {
  return async <T>(
    path: string,
    options: RequestJsonOptions = {},
  ): Promise<T> => {
    try {
      return await base<T>(
        path,
        withAccessToken(options, session.getAccessToken()),
      );
    } catch (error) {
      if (!isApiError(error) || error.status !== 401) throw error;

      const refreshedToken = await session.refresh();
      if (!refreshedToken) {
        session.expire();
        throw error;
      }

      try {
        return await base<T>(
          path,
          withAccessToken(options, session.getAccessToken() ?? refreshedToken),
        );
      } catch (retryError) {
        if (isApiError(retryError) && retryError.status === 401) {
          session.expire();
        }
        throw retryError;
      }
    }
  };
}
