import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/apiError";

export function useRateLimit(error: unknown) {
  const [elapsed, setElapsed] = useState<unknown>();
  const delay =
    error instanceof ApiError && error.kind === "rate-limit"
      ? (error.details.retryAfterMs ?? 60_000)
      : 0;
  useEffect(() => {
    if (!delay) return;
    const timer = setTimeout(() => {
      setElapsed(error);
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [delay, error]);
  return { blocked: delay > 0 && elapsed !== error, delay };
}
