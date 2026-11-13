import { ApiError, type ApiErrorDetails } from "@/lib/api/apiError";
import { MOCK_PEOPLE, type MockPersonaKey } from "@/mocks/people";

export type MockFailureKind =
  | "forbidden"
  | "not-found"
  | "conflict"
  | "validation"
  | "rate-limit"
  | "server";
const failures = new Map<string, MockFailureKind>();
let persona: MockPersonaKey | undefined;
let resetVersion = 0;
export function mockResetVersion(): number {
  return resetVersion;
}

/** Repository latency only; it is never selected by URL or UI state. */
export function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function resolveMockPersona(
  surface: "workspace" | "portal" = "workspace",
) {
  const key = persona ?? (surface === "portal" ? "u-tomasz" : "u-linh");
  const person = MOCK_PEOPLE.find((item) => item.key === key);
  if (!person) throw new Error("Unknown mock persona.");
  return person;
}

const errorDefinitions = {
  forbidden: [403, "You do not have access to this resource."],
  "not-found": [404, "The requested resource was not found."],
  conflict: [409, "The resource changed. Reload it before trying again."],
  validation: [422, "Check the highlighted fields."],
  "rate-limit": [429, "Too many requests. Wait before trying again."],
  server: [503, "The server could not complete the request. Try again later."],
} as const;

export function throwMockFailure(
  kind: MockFailureKind,
  details: ApiErrorDetails = {},
): never {
  const [status, message] = errorDefinitions[kind];
  throw new ApiError(kind, message, {
    status,
    ...(kind === "rate-limit" ? { retryAfterMs: 60_000 } : {}),
    ...details,
  });
}

export function checkMockFailure(operation: string): void {
  const kind = failures.get(operation);
  if (kind) throwMockFailure(kind);
}

function requireTestMode() {
  if (import.meta.env.MODE !== "test")
    throw new Error("Mock controls are available only in tests.");
}

/** Test-only controls. No router, component, storage or session reads belong here. */
export function __setMockPersona(key: MockPersonaKey): void {
  requireTestMode();
  if (!MOCK_PEOPLE.some((person) => person.key === key))
    throw new Error("Unknown mock persona.");
  persona = key;
}
export function __setMockFailure(
  operation: string,
  kind: MockFailureKind | null,
): void {
  requireTestMode();
  if (kind === null) failures.delete(operation);
  else failures.set(operation, kind);
}
export function __resetMocks(): void {
  requireTestMode();
  persona = undefined;
  failures.clear();
  resetVersion++;
}
