import { mutationOptions } from "@tanstack/react-query";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import {
  assertProjectScope,
  projectKey,
  type ProjectScope,
} from "@/features/projects/api/queryScope";
import type {
  ActivateProjectRequest,
  ProjectDetail,
  ProjectKind,
} from "@/features/projects/api/types";
export type ProjectSettingsWrite =
  | { action: "setSprintLength"; weeks: 1 | 2 | 3 | 4; expectedVersion: number }
  | {
      action: "changeEngagement";
      request: {
        kind: ProjectKind;
        engagementId: string | null;
        expectedVersion: number;
        reason: string;
      };
    }
  | { action: "activate"; request: ActivateProjectRequest };
export function projectSettingsMutation(scope: ProjectScope, id: string) {
  return mutationOptions({
    mutationKey: [...projectKey(scope, id), "settings", "write"],
    retry: false,
    mutationFn: async (
      input: ProjectSettingsWrite,
    ): Promise<{
      project: ProjectDetail;
      engagementSummaryWithdrawn: boolean;
    }> => {
      assertProjectScope(scope);
      const repo = getProjectRepository(),
        wid = scope.workspaceId;
      const result = await (async () => {
        if (input.action === "changeEngagement") {
          const project = await repo.changeEngagement(wid, id, input.request);
          return {
            project,
            engagementSummaryWithdrawn: project.engagementSummaryWithdrawn,
          };
        }
        const project =
          input.action === "activate"
            ? await repo.activate(wid, id, input.request)
            : await repo.setSprintLength(
                wid,
                id,
                input.weeks,
                input.expectedVersion,
              );
        return { project, engagementSummaryWithdrawn: false };
      })();
      assertProjectScope(scope);
      return result;
    },
  });
}
