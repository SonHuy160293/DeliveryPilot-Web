import { before, forbidden } from "@/features/engagements/api/mockSupport";
import { mockLinkState } from "@/features/engagements/api/mockLinkState";
import { MOCK_WORKSPACES } from "@/mocks/people";
import { mockEngagementRepository } from "@/features/engagements/api/mockEngagementRepository";
import { ApiError } from "@/lib/api/apiError";
function authorize(key: string) {
  if (
    !MOCK_WORKSPACES.some((workspace) =>
      workspace.members.some(
        (member) =>
          member.userKey === key &&
          member.roles.some((role) => role === "Owner" || role === "Admin"),
      ),
    )
  )
    forbidden();
}
export const clientLinkMock = {
  async list(workspaceId: string) {
    const actor = await before("clientLinks.list");
    authorize(actor.person.key);
    return mockLinkState.list(workspaceId);
  },
  async preview(workspaceId: string, code: string) {
    const actor = await before("clientLinks.preview").catch(
      (error: unknown) => {
        if (error instanceof ApiError && error.kind === "rate-limit")
          throw new ApiError("rate-limit", error.message, {
            status: 429,
            retryAfterMs: 120000,
          });
        throw error;
      },
    );
    authorize(actor.person.key);
    const { preview, source } = mockLinkState.inspect(workspaceId, code);
    if (source)
      mockEngagementRepository.validateMockClientLink(
        source.workspaceId,
        source.engagementId,
      );
    return preview;
  },
  async confirm(workspaceId: string, code: string) {
    const actor = await before("clientLinks.confirm");
    authorize(actor.person.key);
    const { source } = mockLinkState.inspect(workspaceId, code);
    if (source)
      mockEngagementRepository.validateMockClientLink(
        source.workspaceId,
        source.engagementId,
      );
    const result = mockLinkState.confirm(workspaceId, code);
    if (result.source)
      mockEngagementRepository.applyMockClientLink(
        result.source.workspaceId,
        result.source.engagementId,
        workspaceId,
        actor.person.id,
      );
    return result;
  },
  async remove(workspaceId: string, id: string, version: number) {
    const actor = await before("clientLinks.remove");
    authorize(actor.person.key);
    const source = mockLinkState.remove(workspaceId, id, version);
    if (source)
      mockEngagementRepository.applyMockClientLink(
        source.workspaceId,
        source.engagementId,
        null,
        actor.person.id,
      );
  },
};
