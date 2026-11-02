import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/apiError";

// A query may come from a non-HTTP source; callers must narrow rather than assume an ApiError.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: unknown;
  }
}

export function retryQuery(failureCount: number, error: unknown): boolean {
  return (
    failureCount < 2 &&
    error instanceof ApiError &&
    (error.details.method === "GET" || error.details.method === "HEAD") &&
    ["network", "timeout", "server", "rate-limit"].includes(error.kind) &&
    (error.details.retryAfterMs === undefined ||
      error.details.retryAfterMs <= 30_000)
  );
}

export function queryRetryDelay(attempt: number, error: unknown): number {
  return error instanceof ApiError && error.details.retryAfterMs !== undefined
    ? Math.min(error.details.retryAfterMs, 30_000)
    : Math.min(1000 * 2 ** attempt, 10_000);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: retryQuery,
        retryDelay: queryRetryDelay,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: { retry: false },
    },
  });
}
