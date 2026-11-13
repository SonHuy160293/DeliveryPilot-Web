import type { ProjectRepository } from "@/features/projects/api/projectRepository";
import type { ProjectWorkspace } from "@/features/projects/api/mockSupport";
import {
  before,
  access,
  requireAbility,
  parse,
  checkVersion,
  recordEvent,
  assertActor,
  present,
} from "@/features/projects/api/mockSupport";
import {
  projectConflict,
  ProjectActivationError,
} from "@/features/projects/api/projectErrors";
import * as shapes from "@/features/projects/api/contracts";
import { computeReadiness } from "@/features/projects/model/readiness";
import type {
  ProjectEngagementRef,
  ProjectBrief,
} from "@/features/projects/api/types";
import type { ProjectSharingAdapter } from "@/features/projects/api/sharingAdapter";
const briefFields = {
  Problem: "problem",
  ObjectivesAndSuccessCriteria: "objectivesAndSuccessCriteria",
  ScopeAndExclusions: "scopeAndExclusions",
  Assumptions: "assumptions",
  ConstraintsAndDependencies: "constraintsAndDependencies",
  OpenQuestions: "openQuestions",
  ProductGoal: "productGoal",
} as const satisfies Record<string, keyof ProjectBrief>;
export function createMockProjectSettings(
  store: (workspaceId: string) => ProjectWorkspace,
  activeEngagement: (
    workspaceId: string,
    id: string,
  ) => Promise<ProjectEngagementRef>,
  sharing: ProjectSharingAdapter,
) {
  const methods: Pick<
    ProjectRepository,
    | "getBrief"
    | "updateBriefItem"
    | "setSprintLength"
    | "changeEngagement"
    | "activate"
  > = {
    async getBrief(workspaceId, id, signal) {
      const current = await before("projects.getBrief", signal),
        { record, participant, permissions } = access(
          store(workspaceId),
          id,
          current,
          true,
        );
      if (participant.kind === "Guest")
        requireAbility(permissions, "editBrief");
      return structuredClone(record.brief);
    },
    async updateBriefItem(workspaceId, id, input) {
      const current = await before("projects.updateBriefItem"),
        request = parse(shapes.updateBriefItemRequest, input);
      const { record, permissions } = access(
        store(workspaceId),
        id,
        current,
        true,
      );
      requireAbility(permissions, "editBrief");
      checkVersion(record.brief.version, request.expectedVersion);
      const key = briefFields[request.item],
        value = request.value?.trim() || null,
        now = new Date().toISOString();
      if (
        key === "productGoal" &&
        record.brief.productGoal &&
        record.brief.productGoal !== value
      )
        record.brief.previousProductGoals.unshift({
          value: record.brief.productGoal,
          replacedAt: now,
          replacedByUserId: current.person.id,
        });
      record.brief[key] = value;
      record.brief.version++;
      record.brief.updatedAt = now;
      record.brief.updatedByUserId = current.person.id;
      recordEvent(
        record,
        current,
        key === "productGoal" ? "ProductGoalChanged" : "BriefItemChanged",
        key === "productGoal"
          ? "Product Goal changed"
          : `${request.item} updated`,
      );
      return structuredClone(record.brief);
    },
    async setSprintLength(workspaceId, id, weeks, expectedVersion) {
      const current = await before("projects.setSprintLength");
      parse(shapes.version, expectedVersion);
      parse(shapes.sprintLength, weeks);
      const { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "editCadence");
      checkVersion(record.detail.version, expectedVersion);
      record.detail.sprintLengthWeeks = weeks;
      recordEvent(
        record,
        current,
        "SprintLengthChanged",
        `Sprint length set to ${String(weeks)} weeks`,
      );
      return present(record, current);
    },
    async changeEngagement(workspaceId, id, input) {
      const current = await before("projects.changeEngagement"),
        request = parse(shapes.changeEngagementRequest, input);
      const { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "changeEngagement");
      checkVersion(record.detail.version, request.expectedVersion);
      if (record.detail.status !== "Draft") projectConflict();
      const engagement =
        request.kind === "Client" && request.engagementId
          ? await activeEngagement(workspaceId, request.engagementId)
          : null;
      assertActor(current);
      requireAbility(
        access(store(workspaceId), id, current).permissions,
        "changeEngagement",
      );
      checkVersion(record.detail.version, request.expectedVersion);
      const changed =
        record.detail.kind !== request.kind ||
        record.detail.engagement?.id !== engagement?.id;
      const engagementSummaryWithdrawn =
        changed &&
        sharing.withdrawEngagementSummary({
          workspaceId,
          projectId: id,
          engagementId: record.detail.engagement?.id ?? null,
          actorUserId: current.person.id,
          actorDisplayName: current.person.displayName,
          reason: request.reason,
        });
      record.detail.kind = request.kind;
      record.detail.engagement = engagement;
      if (request.kind === "Internal") {
        record.detail.clientProductOwner = null;
        for (const item of record.participants)
          if (item.isClientProductOwner) {
            item.isClientProductOwner = false;
            item.version++;
          }
      }
      recordEvent(
        record,
        current,
        "EngagementChanged",
        "Engagement changed",
        request.reason,
      );
      return { ...present(record, current), engagementSummaryWithdrawn };
    },
    async activate(workspaceId, id, input) {
      const current = await before("projects.activate"),
        request = parse(shapes.activateProjectRequest, input);
      const { record, permissions } = access(store(workspaceId), id, current);
      checkVersion(record.detail.version, request.expectedVersion);
      if (record.detail.status !== "Draft") projectConflict();
      requireAbility(permissions, "activate");
      const gaps = computeReadiness(
        {
          ...record.detail,
          clientPoWaiverReason: request.clientPoWaiverReason,
        },
        record.brief,
        record.participants,
      );
      if (gaps.length) throw new ProjectActivationError(gaps);
      record.detail.status = "Active";
      record.detail.activatedAt = new Date().toISOString();
      record.detail.activatedByUserId = current.person.id;
      record.detail.clientPoWaiverReason =
        record.detail.kind === "Client" && !record.detail.clientProductOwner
          ? request.clientPoWaiverReason
          : null;
      recordEvent(
        record,
        current,
        "ProjectActivated",
        "Project activated",
        request.clientPoWaiverReason,
      );
      return present(record, current);
    },
  };
  return methods;
}
