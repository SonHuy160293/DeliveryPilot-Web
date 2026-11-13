import type {
  ProjectRecord,
  ProjectWorkspace,
} from "@/features/projects/api/mockSupport";
import { firstProject } from "@/test/fixtures/projectMock";
import { participantFixtures } from "@/mocks/projects";
import type { Participant } from "@/features/projects/api/types";
const participantSources: Readonly<Record<string, readonly Participant[]>> =
  participantFixtures;
/** Synthetic repository state exercises Draft sharing without changing supplied production fixtures. */
export function draftSharingRecord(): {
  record: ProjectRecord;
  workspace: ProjectWorkspace;
} {
  const record: ProjectRecord = {
    detail: {
      ...structuredClone(firstProject.detail),
      status: "Draft",
      activatedAt: null,
      activatedByUserId: null,
    },
    brief: structuredClone(firstProject.brief),
    participants: (participantSources[firstProject.detail.id] ?? []).map(
      (row) => structuredClone(row),
    ),
    invitations: [],
    stakeholders: [],
    events: [],
  };
  return {
    record,
    workspace: { records: new Map([[record.detail.id, record]]) },
  };
}
