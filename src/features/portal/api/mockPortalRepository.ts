import type { PortalRepository } from "@/features/portal/api/portalRepository";
import { portalMockAdapter } from "@/mocks/portalAdapter";
import {
  delay,
  resolveMockPersona,
  mockResetVersion,
  checkMockFailure,
} from "@/mocks/mockRuntime";
import { ApiError } from "@/lib/api/apiError";
async function before(
  operation: string,
  signal?: AbortSignal,
  surface: "portal" | "workspace" = "portal",
) {
  const person = resolveMockPersona(surface),
    epoch = mockResetVersion();
  await delay();
  if (
    signal?.aborted ||
    epoch !== mockResetVersion() ||
    resolveMockPersona(surface).key !== person.key
  )
    throw new ApiError("cancelled", "The request was cancelled.");
  checkMockFailure(operation);
  return () => {
    if (
      signal?.aborted ||
      epoch !== mockResetVersion() ||
      resolveMockPersona(surface).key !== person.key
    )
      throw new ApiError("cancelled", "The request was cancelled.");
  };
}
export const mockPortalRepository: PortalRepository = {
  kind: "mock",
  async list() {
    await before("portal.list");
    return portalMockAdapter.list();
  },
  async view(id, signal) {
    const assert = await before("portal.view", signal);
    const view = await portalMockAdapter.view(id, signal);
    assert();
    try {
      checkMockFailure("portal.names");
    } catch (error) {
      if (!(error instanceof ApiError) || error.kind !== "server") throw error;
      return {
        ...view,
        team: view.team.map((person) => ({ ...person, displayName: null })),
        clientProductOwnerName: null,
      };
    }
    return view;
  },
  async preview(workspaceId, id, signal) {
    const assert = await before("portal.preview", signal, "workspace");
    const view = await portalMockAdapter.preview(workspaceId, id, signal);
    assert();
    return view;
  },
  async updateBrief(id, request) {
    return portalMockAdapter.updateBrief(id, request);
  },
  async updateStakeholder(id, stakeholderId, request) {
    return portalMockAdapter.updateStakeholder(id, stakeholderId, request);
  },
  async leave(id) {
    return portalMockAdapter.leave(id);
  },
};
