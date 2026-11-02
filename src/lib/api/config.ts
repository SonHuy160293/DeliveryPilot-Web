import { ApiError } from "@/lib/api/apiError";

export interface ApiConfig {
  baseUrl?: string;
  timeoutMs: number;
}

export function readApiConfig(env: Record<string, unknown>): ApiConfig {
  const value = env.VITE_API_BASE_URL;
  const baseUrl =
    typeof value === "string" && value.trim() ? value.trim() : undefined;
  const timeout = env.VITE_API_TIMEOUT_MS;
  const timeoutMs =
    timeout === undefined || timeout === "" ? 15_000 : Number(timeout);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120_000) {
    throw new ApiError(
      "configuration",
      "API timeout must be an integer from 100 to 120000 milliseconds.",
    );
  }
  return { baseUrl, timeoutMs };
}
