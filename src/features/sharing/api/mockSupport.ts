import { z } from "zod";
import { ApiError } from "@/lib/api/apiError";
import {
  delay,
  resolveMockPersona,
  mockResetVersion,
  checkMockFailure,
} from "@/mocks/mockRuntime";
export function sharingError(
  kind: "forbidden" | "not-found" | "conflict",
): never {
  throw new ApiError(
    kind,
    "Sharing is unavailable. Reload to see the latest state.",
    { status: { forbidden: 403, "not-found": 404, conflict: 409 }[kind] },
  );
}
export function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new ApiError("validation", "Choose a shareable item.", { status: 422 });
}
export async function before(operation: string, signal?: AbortSignal) {
  const person = resolveMockPersona(),
    epoch = mockResetVersion();
  const assert = () => {
    if (
      signal?.aborted ||
      epoch !== mockResetVersion() ||
      person.key !== resolveMockPersona().key
    )
      throw new ApiError("cancelled", "The request was cancelled.");
  };
  assert();
  await delay();
  assert();
  checkMockFailure(operation);
  return { person, assert };
}
export function eventPage<T extends { id: string }>(
  items: readonly T[],
  cursor: string | null | undefined,
  tag: string,
) {
  let offset = 0;
  if (cursor) {
    let value: unknown;
    try {
      value = JSON.parse(atob(cursor));
    } catch {
      sharingError("not-found");
    }
    const parsed = z
      .object({ tag: z.literal(tag), after: z.string() })
      .safeParse(value);
    if (!parsed.success) sharingError("not-found");
    offset = items.findIndex((item) => item.id === parsed.data.after) + 1;
    if (!offset) sharingError("not-found");
  }
  const rows = items.slice(offset, offset + 50),
    last = rows.at(-1);
  return {
    items: structuredClone(rows),
    nextCursor:
      offset + rows.length < items.length && last
        ? btoa(JSON.stringify({ tag, after: last.id }))
        : null,
  };
}
