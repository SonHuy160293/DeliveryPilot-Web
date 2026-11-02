import type { z } from "zod";
import { decode, uuid } from "@/features/workspaces/api/contracts";
import { ApiError } from "@/lib/api/apiError";
import { unwrapApiResponse } from "@/lib/api/apiResponse";
import { authSession } from "@/lib/api/authSession";
import { httpClient } from "@/lib/api/httpClient";

export interface SessionOwner {
  accountId: string;
  generation: number;
}
export function ownerFor(accountId: string): SessionOwner {
  const owner = { accountId, generation: authSession.version() };
  assertOwner(owner);
  return owner;
}
export function isOwner(owner: SessionOwner): boolean {
  const current = authSession.getSnapshot();
  return (
    current.status === "authenticated" &&
    current.userId === owner.accountId &&
    authSession.version() === owner.generation
  );
}
export function assertOwner(owner: SessionOwner): void {
  if (!isOwner(owner)) throw new ApiError("cancelled", "The session changed.");
}
export function organizationPath(id: string): string {
  return `api/v1/organizations/${uuid.parse(id)}`;
}
/** Feature-local decoding, using the single shared transport and error boundary. */
export async function request<T>(
  owner: SessionOwner,
  method: "GET" | "POST" | "PUT",
  path: string,
  schema: z.ZodType<T>,
  options: {
    body?: unknown;
    params?: object;
    signal?: AbortSignal;
    attemptId?: string;
  } = {},
): Promise<T> {
  assertOwner(owner);
  try {
    const response = await httpClient.request<unknown>({
      method,
      url: path,
      data: options.body,
      params: options.params,
      signal: options.signal,
      headers: options.attemptId
        ? { "Idempotency-Key": uuid.parse(options.attemptId) }
        : undefined,
    });
    assertOwner(owner);
    if (options.signal?.aborted)
      throw new ApiError("cancelled", "The request was cancelled.");
    return decode(schema, unwrapApiResponse(response.data));
  } catch (error) {
    assertOwner(owner);
    throw error;
  }
}
