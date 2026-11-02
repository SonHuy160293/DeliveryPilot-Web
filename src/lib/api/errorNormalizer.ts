import axios from "axios";
import { ApiError, type ApiErrorKind } from "@/lib/api/apiError";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function identifier(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-z0-9_.:-]{1,128}$/i.test(value)
    ? value
    : undefined;
}

export function retryAfterMilliseconds(
  value: unknown,
  now = Date.now(),
): number | undefined {
  if (typeof value !== "string") return undefined;
  const seconds = /^\d+(?:\.\d+)?$/.test(value.trim())
    ? Number(value)
    : undefined;
  const milliseconds =
    seconds === undefined ? Date.parse(value) - now : seconds * 1000;
  return Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : undefined;
}

const statuses: Readonly<Record<number, readonly [ApiErrorKind, string]>> = {
  400: ["bad-request", "Check the request and try again."],
  401: ["unauthenticated", "Sign in to continue."],
  403: ["forbidden", "You do not have access to this resource."],
  404: ["not-found", "The requested resource was not found."],
  409: ["conflict", "The resource changed. Reload it before trying again."],
  422: ["validation", "Check the highlighted fields."],
  429: ["rate-limit", "Too many requests. Wait before trying again."],
};

function validationFields(
  value: unknown,
): Readonly<Record<string, readonly string[]>> | undefined {
  if (!isRecord(value)) return undefined;
  const fields: Record<string, readonly string[]> = {};
  for (const [key, messages] of Object.entries(value).slice(0, 20)) {
    if (key.length <= 100 && Array.isArray(messages)) {
      const safeMessages = messages
        .filter(
          (item): item is string =>
            typeof item === "string" && item.length <= 300,
        )
        .slice(0, 5);
      if (safeMessages.length)
        Object.defineProperty(fields, key, {
          value: safeMessages,
          enumerable: true,
        });
    }
  }
  return Object.keys(fields).length ? fields : undefined;
}

/** Shared backend envelope and ASP.NET ProblemDetails diagnostics; never display raw detail/title. */
export function responseDiagnostics(body: unknown, status?: number) {
  const record = isRecord(body) ? body : {};
  const payload = isRecord(record.error) ? record.error : record;
  return {
    code: identifier(payload.code),
    traceId: identifier(payload.traceId),
    fieldErrors:
      status === 400 || status === 422
        ? validationFields(payload.errors)
        : undefined,
  };
}

export function normalizeApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isCancel(error))
    return new ApiError("cancelled", "The request was cancelled.");
  if (!axios.isAxiosError<unknown>(error))
    return new ApiError("protocol", "The response could not be read.");
  const method = error.config?.method?.toUpperCase();
  if (error.code === "ERR_BAD_RESPONSE" && error.cause instanceof SyntaxError) {
    return new ApiError("protocol", "The response could not be read.", {
      method,
      status: error.response?.status,
    });
  }
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return new ApiError("timeout", "The request timed out. Try again.", {
      method,
    });
  }
  const status = error.response?.status;
  if (status === undefined)
    return new ApiError(
      "network",
      "Could not reach the server. Check your connection.",
      { method },
    );
  const [kind, message] =
    statuses[status] ??
    (status >= 500
      ? [
          "server",
          "The server could not complete the request. Try again later.",
        ]
      : ["http", "The request could not be completed."]);
  const metadata = responseDiagnostics(error.response?.data, status);
  return new ApiError(kind, message, {
    status,
    method,
    ...metadata,
    traceId:
      metadata.traceId ??
      identifier(error.response?.headers["x-correlation-id"]),
    retryAfterMs: retryAfterMilliseconds(
      error.response?.headers["retry-after"],
    ),
  });
}
