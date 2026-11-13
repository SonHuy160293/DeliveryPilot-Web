import {
  queryOptions,
  infiniteQueryOptions,
  mutationOptions,
} from "@tanstack/react-query";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import type {
  CreateProjectRequest,
  UpdateBriefItemRequest,
} from "@/features/projects/api/types";
import {
  projectsKey,
  projectKey,
  assertProjectScope,
  type ProjectScope,
} from "@/features/projects/api/queryScope";
export {
  projectsKey,
  projectKey,
  assertProjectScope,
  isCurrentProjectScope,
} from "@/features/projects/api/queryScope";
export type { ProjectScope } from "@/features/projects/api/queryScope";
export { projectWriteMutation } from "@/features/projects/api/projectMutations";
export type { ProjectWrite } from "@/features/projects/api/projectMutations";
export { ProjectActivationError } from "@/features/projects/api/projectErrors";
export { projectSettingsMutation } from "@/features/projects/api/settingsMutations";
export type { ProjectSettingsWrite } from "@/features/projects/api/settingsMutations";
export const projectSettingsContextQuery = (scope: ProjectScope, id: string) =>
  read(scope, [...projectKey(scope, id), "settings-context"], (signal) =>
    getProjectRepository().settingsContext(scope.workspaceId, id, signal),
  );
export const projectEngagementOptionsQuery = (
  scope: ProjectScope,
  id: string,
) =>
  read(scope, [...projectKey(scope, id), "engagement-options"], (signal) =>
    getProjectRepository().engagementOptions(scope.workspaceId, id, signal),
  );
export const projectRepositoryKind = () => getProjectRepository().kind;
export const projectTeamContextQuery = (scope: ProjectScope, id: string) =>
  read(scope, [...projectKey(scope, id), "team-context"], (signal) =>
    getProjectRepository().teamContext(scope.workspaceId, id, signal),
  );
function read<T>(
  scope: ProjectScope,
  key: readonly unknown[],
  load: (signal: AbortSignal) => Promise<T>,
) {
  return queryOptions({
    queryKey: key,
    queryFn: async ({ signal }) => {
      assertProjectScope(scope);
      const result = await load(signal);
      assertProjectScope(scope);
      return result;
    },
  });
}
export const myProjectsQuery = (scope: ProjectScope) =>
  read(scope, [...projectsKey(scope), "mine"], (signal) =>
    getProjectRepository().listMine(scope.workspaceId, signal),
  );
export const projectCreationOptionsQuery = (scope: ProjectScope) =>
  read(scope, [...projectsKey(scope), "creation-options"], (signal) =>
    getProjectRepository().creationOptions(scope.workspaceId, signal),
  );
export const projectQuery = (scope: ProjectScope, id: string) =>
  read(scope, [...projectKey(scope, id), "detail"], (signal) =>
    getProjectRepository().get(scope.workspaceId, id, signal),
  );
export const projectBriefQuery = (scope: ProjectScope, id: string) =>
  read(scope, [...projectKey(scope, id), "brief"], (signal) =>
    getProjectRepository().getBrief(scope.workspaceId, id, signal),
  );
export const projectOverviewContextQuery = (scope: ProjectScope, id: string) =>
  read(scope, [...projectKey(scope, id), "overview-context"], (signal) =>
    getProjectRepository().overviewContext(scope.workspaceId, id, signal),
  );
export function updateProjectBriefMutation(scope: ProjectScope, id: string) {
  return mutationOptions({
    mutationKey: [...projectKey(scope, id), "brief", "update"],
    retry: false,
    mutationFn: async (request: UpdateBriefItemRequest) => {
      assertProjectScope(scope);
      const result = await getProjectRepository().updateBriefItem(
        scope.workspaceId,
        id,
        request,
      );
      assertProjectScope(scope);
      return result;
    },
  });
}
export const projectParticipantsQuery = (scope: ProjectScope, id: string) =>
  read(scope, [...projectKey(scope, id), "participants"], (signal) =>
    getProjectRepository().listParticipants(scope.workspaceId, id, signal),
  );
export const projectInvitationsQuery = (scope: ProjectScope, id: string) =>
  read(scope, [...projectKey(scope, id), "invitations"], (signal) =>
    getProjectRepository().listInvitations(scope.workspaceId, id, signal),
  );
export const projectStakeholdersQuery = (
  scope: ProjectScope,
  id: string,
  includeRetired = false,
) =>
  read(
    scope,
    [...projectKey(scope, id), "stakeholders", { includeRetired }],
    (signal) =>
      getProjectRepository().listStakeholders(
        scope.workspaceId,
        id,
        includeRetired,
        signal,
      ),
  );
export const orphanedProjectsQuery = (scope: ProjectScope) =>
  read(scope, [...projectsKey(scope), "orphaned"], (signal) =>
    getProjectRepository().listOrphaned(scope.workspaceId, signal),
  );
export function projectHistoryQuery(scope: ProjectScope, id: string) {
  return infiniteQueryOptions({
    queryKey: [...projectKey(scope, id), "history"],
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ signal, pageParam }) => {
      assertProjectScope(scope);
      const result = await getProjectRepository().history(
        scope.workspaceId,
        id,
        { cursor: pageParam },
        signal,
      );
      assertProjectScope(scope);
      return result;
    },
    getNextPageParam: (page) => page.nextCursor ?? undefined,
  });
}
export function createProjectMutation(scope: ProjectScope) {
  return mutationOptions({
    mutationKey: [...projectsKey(scope), "create"],
    retry: false,
    mutationFn: async (input: {
      request: CreateProjectRequest;
      idempotencyKey: string;
    }) => {
      assertProjectScope(scope);
      const result = await getProjectRepository().create(
        scope.workspaceId,
        input.request,
        input.idempotencyKey,
      );
      assertProjectScope(scope);
      return result;
    },
  });
}
export function leaveProjectMutation(
  scope: Pick<ProjectScope, "accountId" | "generation">,
  id: string,
) {
  return mutationOptions({
    mutationKey: ["account", scope.accountId, "portal", "project", id, "leave"],
    retry: false,
    mutationFn: async () => {
      assertProjectScope(scope);
      await getProjectRepository().leave(id);
      assertProjectScope(scope);
    },
  });
}
