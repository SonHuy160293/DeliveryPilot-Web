import { vi } from "vitest";

/** Settle repository timers without unhandled rejection races in fake-time tests. */
export async function settleMock<T>(pending: Promise<T>): Promise<T> {
  const observed = pending.then(
    (value) => ({ value }),
    (error: unknown) => ({ error }),
  );
  await vi.advanceTimersByTimeAsync(1000);
  const result = await observed;
  if ("error" in result) throw result.error;
  return result.value;
}
