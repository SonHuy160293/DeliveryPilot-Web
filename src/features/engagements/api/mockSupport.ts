import type { z } from "zod";
import { ApiError } from "@/lib/api/apiError";
import {
  checkMockFailure,
  delay,
  resolveMockPersona,
  mockResetVersion,
} from "@/mocks/mockRuntime";
import { MOCK_WORKSPACES, type MockWorkspace } from "@/mocks/people";
import { listParams } from "@/features/engagements/api/contracts";

export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;
  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "request");
    fields[field] = [...(fields[field] ?? []), issue.message];
  }
  throw new ApiError("validation", "Check the highlighted fields.", {
    status: 422,
    fieldErrors: fields,
  });
}
export function permissions() {
  const person = resolveMockPersona();
  const workspaces: readonly MockWorkspace[] = MOCK_WORKSPACES;
  const membership = workspaces
    .flatMap((workspace) => workspace.members)
    .find((member) => member.userKey === person.key);
  const codes: readonly string[] = membership?.permissionCodes ?? [];
  return {
    person,
    create: codes.includes("organization.engagements.create"),
    readAll:
      codes.includes("organization.engagements.read-all") ||
      codes.includes("organization.engagements.manage"),
    manage: codes.includes("organization.engagements.manage"),
    createProject: codes.includes("organization.projects.create"),
  };
}
export async function before(operation: string, signal?: AbortSignal) {
  const actor = permissions();
  const resetVersion = mockResetVersion();
  if (signal?.aborted)
    throw new ApiError("cancelled", "The request was cancelled.");
  await delay();
  if (
    signal?.aborted ||
    resetVersion !== mockResetVersion() ||
    resolveMockPersona().key !== actor.person.key
  )
    throw new ApiError("cancelled", "The request was cancelled.");
  try {
    checkMockFailure("engagements.identity");
  } catch (error) {
    if (error instanceof ApiError)
      throw new ApiError(error.kind, error.message, {
        ...error.details,
        code: "Identity.Unavailable",
      });
    throw error;
  }
  checkMockFailure(operation);
  return actor;
}
export function forbidden(): never {
  throw new ApiError("forbidden", "You do not have access to this operation.", {
    status: 403,
  });
}
export function notFound(): never {
  throw new ApiError(
    "not-found",
    "This engagement isn't available. It may not exist, or you may not have access.",
    { status: 404 },
  );
}
export function conflict(): never {
  throw new ApiError(
    "conflict",
    "Someone else changed this. Reload to see the latest version.",
    { status: 409 },
  );
}

/** The cursor is scoped to the visible result set; it never confers access. */
export function page<T extends { id: string }>(
  items: readonly T[],
  input: { limit?: number; cursor?: string | null },
  tag: string,
) {
  const params = parse(listParams, input);
  let offset = 0;
  if (params.cursor) {
    let cursor: unknown;
    try {
      cursor = JSON.parse(atob(params.cursor));
    } catch {
      throw new ApiError("bad-request", "Choose a current page.", {
        status: 400,
      });
    }
    if (
      typeof cursor !== "object" ||
      cursor === null ||
      !("tag" in cursor) ||
      cursor.tag !== tag ||
      !("after" in cursor) ||
      typeof cursor.after !== "string"
    )
      throw new ApiError("bad-request", "Choose a current page.", {
        status: 400,
      });
    offset = items.findIndex((item) => item.id === cursor.after) + 1;
    if (!offset)
      throw new ApiError("bad-request", "Choose a current page.", {
        status: 400,
      });
  }
  const selected = items.slice(offset, offset + params.limit);
  const last = selected.at(-1);
  return {
    items: structuredClone(selected),
    nextCursor:
      offset + selected.length < items.length && last
        ? btoa(JSON.stringify({ tag, after: last.id }))
        : null,
  };
}
