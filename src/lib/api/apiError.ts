export type ApiErrorKind =
  | "configuration"
  | "bad-request"
  | "unauthenticated"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "validation"
  | "rate-limit"
  | "server"
  | "http"
  | "network"
  | "timeout"
  | "cancelled"
  | "application"
  | "protocol";

export interface ApiErrorDetails {
  status?: number;
  method?: string;
  code?: string;
  traceId?: string;
  retryAfterMs?: number;
  fieldErrors?: Readonly<Record<string, readonly string[]>>;
}

/** Intentionally contains no Axios config, response body, credentials, or raw cause. */
export class ApiError extends Error {
  readonly name = "ApiError";
  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly details: ApiErrorDetails = {},
  ) {
    super(message);
  }
}
