import type { GuestShare, ShareEvent } from "@/features/sharing/api/types";
import {
  guestShareFixtures,
  shareEventFixtures,
  shareFixtureProjectId,
} from "@/mocks/portal";
import { mockResetVersion } from "@/mocks/mockRuntime";
interface ShareState {
  shares: GuestShare[];
  history: ShareEvent[];
}
interface WithdrawalActor {
  workspaceId: string;
  projectId: string;
  actorUserId: string;
  actorDisplayName: string;
  reason: string | null;
}
export function createMockShareStore() {
  let epoch = mockResetVersion();
  const scopes = new Map<string, ShareState>();
  function project(workspaceId: string, projectId: string) {
    if (epoch !== mockResetVersion()) {
      scopes.clear();
      epoch = mockResetVersion();
    }
    const key = JSON.stringify([workspaceId, projectId]);
    let state = scopes.get(key);
    if (!state) {
      state = {
        shares:
          projectId === shareFixtureProjectId
            ? guestShareFixtures.map((row) => ({ ...row }))
            : [],
        history:
          projectId === shareFixtureProjectId
            ? shareEventFixtures.map((row) => ({ ...row }))
            : [],
      };
      scopes.set(key, state);
    }
    return state;
  }
  function withdraw(
    input: WithdrawalActor,
    matches: (row: GuestShare) => boolean,
    label: string,
  ) {
    const state = project(input.workspaceId, input.projectId),
      now = new Date().toISOString();
    let changed = false;
    for (const row of state.shares) {
      if (row.status !== "Shared" || !matches(row)) continue;
      row.status = "Withdrawn";
      row.withdrawnAt = now;
      row.version++;
      state.history.unshift({
        id: crypto.randomUUID(),
        action: "Withdrawn",
        itemType: row.itemType,
        itemLabel: label,
        actorUserId: input.actorUserId,
        actorDisplayName: input.actorDisplayName,
        occurredAt: now,
        reason: input.reason,
      });
      changed = true;
    }
    return changed;
  }
  return {
    project,
    withdrawEngagementSummary: (
      input: WithdrawalActor & { engagementId: string | null },
    ) => {
      return withdraw(
        input,
        (row) =>
          row.itemType === "EngagementSummary" &&
          row.engagementId === input.engagementId,
        "Engagement summary",
      );
    },
    withdrawStakeholder: (
      input: WithdrawalActor & { stakeholderId: string; name: string },
    ) => {
      return withdraw(
        input,
        (row) =>
          row.itemType === "Stakeholder" &&
          row.stakeholderId === input.stakeholderId,
        input.name,
      );
    },
  };
}
export const mockShareStore = createMockShareStore();
