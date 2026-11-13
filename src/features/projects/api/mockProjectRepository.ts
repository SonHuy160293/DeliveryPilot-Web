import type { ProjectRepository } from "@/features/projects/api/projectRepository";
import type { ProjectEngagementAdapter } from "@/features/projects/api/engagementAdapter";
import type {
  ProjectRecord,
  ProjectWorkspace,
  ProjectActor,
} from "@/features/projects/api/mockSupport";
import {
  before,
  parse,
  access,
  present,
  activeAdministrator,
  actor,
  membership,
  recordEvent,
  assertActor,
  eventPage,
  requireAbility,
} from "@/features/projects/api/mockSupport";
import {
  projectConflict,
  projectForbidden,
  projectNotFound,
} from "@/features/projects/api/projectErrors";
import * as shapes from "@/features/projects/api/contracts";
import type {
  ProjectDetail,
  ProjectBrief,
  ProjectEngagementRef,
  Participant,
  GuestInvitation,
  Stakeholder,
  ProjectSharingSnapshot,
  UpdateBriefItemRequest,
} from "@/features/projects/api/types";
import {
  projectFixtures,
  supplementalProjectFixtures,
  participantFixtures,
  supplementalParticipantFixtures,
  guestInvitationFixtures,
  stakeholderFixtures,
  projectEventFixtures,
} from "@/mocks/projects";
import { MOCK_WORKSPACES, MOCK_PEOPLE } from "@/mocks/people";
import { mockResetVersion } from "@/mocks/mockRuntime";
import { ApiError } from "@/lib/api/apiError";
import { createMockProjectTeam } from "@/features/projects/api/mockProjectTeam";
import { createMockProjectSettings } from "@/features/projects/api/mockProjectSettings";
import { createMockProjectInvitations } from "@/features/projects/api/mockProjectInvitations";
import { createMockProjectStakeholders } from "@/features/projects/api/mockProjectStakeholders";
import type { ProjectSharingAdapter } from "@/features/projects/api/sharingAdapter";
import { projectSharingAdapter } from "@/mocks/projectSharingAdapter";
import { createMockProjectRecipient } from "@/features/projects/api/mockProjectRecipient";
import type { ProjectInvitationResponseRepository } from "@/features/projects/guest-invitations/recipient/projectInvitationResponseRepository";
import { ProjectInvitationError } from "@/features/projects/guest-invitations/recipient/recipientErrors";

const participantSources: Readonly<Record<string, readonly Participant[]>> = {
  ...participantFixtures,
  ...supplementalParticipantFixtures,
};
const invitationSources: Readonly<Record<string, readonly GuestInvitation[]>> =
  guestInvitationFixtures;
const stakeholderSources: Readonly<Record<string, readonly Stakeholder[]>> =
  stakeholderFixtures;
export function createMockProjectRepository(
  engagements: ProjectEngagementAdapter,
  sharing: ProjectSharingAdapter = projectSharingAdapter,
): ProjectRepository & {
  recipient: ProjectInvitationResponseRepository;
  sharingSnapshot(workspaceId: string, id: string): ProjectSharingSnapshot;
  portalSnapshot(id: string): {
    workspaceId: string;
    record: ProjectRecord;
    participant: Participant;
  };
  portalList(): {
    workspaceId: string;
    record: ProjectRecord;
    participant: Participant;
  }[];
  portalUpdateBrief(id: string, request: UpdateBriefItemRequest): Promise<void>;
  portalUpdateStakeholder(
    id: string,
    stakeholderId: string,
    request: Pick<
      Stakeholder,
      | "name"
      | "side"
      | "organizationName"
      | "responsibilities"
      | "decisionAreas"
      | "version"
    >,
  ): Promise<void>;
  portalPreviewSnapshot(
    workspaceId: string,
    id: string,
  ): { workspaceId: string; record: ProjectRecord; participant: Participant };
  linkedProjectProjection(
    workspaceId: string,
    engagementId: string,
  ): {
    projectId: string;
    name: string;
    status: "Draft" | "Active";
    administratorNames: (string | null)[];
    callerParticipates: boolean;
  }[];
} {
  let epoch = mockResetVersion();
  const workspaces = new Map<string, ProjectWorkspace>();
  const attempts = new Map<string, { intent: string; id: string }>();
  function store(workspaceId: string): ProjectWorkspace {
    parse(shapes.uuid, workspaceId);
    if (epoch !== mockResetVersion()) {
      workspaces.clear();
      attempts.clear();
      epoch = mockResetVersion();
    }
    let workspace = workspaces.get(workspaceId);
    if (!workspace) {
      const records = new Map<string, ProjectRecord>();
      for (const source of [
        ...projectFixtures,
        ...supplementalProjectFixtures,
      ]) {
        const detail = parse(
          shapes.projectDetail,
          structuredClone(source.detail),
        );
        records.set(detail.id, {
          detail,
          brief: parse(shapes.projectBrief, structuredClone(source.brief)),
          participants: (participantSources[detail.id] ?? []).map((item) =>
            parse(shapes.participant, structuredClone(item)),
          ),
          invitations: (invitationSources[detail.id] ?? []).map((item) =>
            parse(shapes.guestInvitation, structuredClone(item)),
          ),
          stakeholders: (stakeholderSources[detail.id] ?? []).map((item) =>
            parse(shapes.stakeholder, structuredClone(item)),
          ),
          events:
            detail.id === projectFixtures[0]?.detail.id
              ? projectEventFixtures.map((item) =>
                  parse(shapes.projectEvent, structuredClone(item)),
                )
              : [],
        });
      }
      workspace = { records };
      workspaces.set(workspaceId, workspace);
    }
    return workspace;
  }
  function locate(id: string, current: ProjectActor) {
    if (epoch !== mockResetVersion()) {
      workspaces.clear();
      attempts.clear();
      epoch = mockResetVersion();
    }
    if (!workspaces.size) store(MOCK_WORKSPACES[0].organizationId);
    const matches = [...workspaces.values()].filter((workspace) =>
      workspace.records
        .get(id)
        ?.participants.some(
          (item) =>
            item.kind === "Guest" &&
            item.status === "Active" &&
            item.userId === current.person.id,
        ),
    );
    if (matches.length > 1) projectConflict();
    const workspace = matches[0];
    if (!workspace) projectNotFound();
    return workspace;
  }
  async function activeEngagement(
    workspaceId: string,
    id: string,
  ): Promise<ProjectEngagementRef> {
    const row = await engagements.getVisible(workspaceId, id);
    if (row.status !== "Active")
      throw new ApiError(
        "validation",
        "This engagement is closed. Choose an active engagement.",
        {
          status: 422,
          code: "Project.EngagementClosed",
          fieldErrors: {
            engagementId: [
              "This engagement is closed. Choose an active engagement.",
            ],
          },
        },
      );
    return {
      id: row.id,
      clientDisplayName: row.clientDisplayName,
      engagementName: row.engagementName,
      agreementReference: row.agreementReference,
    };
  }
  return {
    kind: "mock",
    recipient: createMockProjectRecipient((invitationId) => {
      if (epoch !== mockResetVersion()) {
        workspaces.clear();
        attempts.clear();
        epoch = mockResetVersion();
      }
      if (!workspaces.size) store(MOCK_WORKSPACES[0].organizationId);
      const matches = [...workspaces.values()].filter((workspace) =>
        [...workspace.records.values()].some((record) =>
          record.invitations.some((item) => item.id === invitationId),
        ),
      );
      const found = matches.length === 1 ? matches[0] : undefined;
      if (!found) throw new ProjectInvitationError("unavailable");
      return found;
    }),
    async settingsContext(workspaceId, id, signal) {
      const current = await before("projects.settingsContext", signal);
      access(store(workspaceId), id, current);
      return {
        people: Object.fromEntries(
          MOCK_PEOPLE.map((person) => [person.id, person.displayName]),
        ),
      };
    },
    async engagementOptions(workspaceId, id, signal) {
      const current = await before("projects.engagementOptions", signal);
      requireAbility(
        access(store(workspaceId), id, current).permissions,
        "changeEngagement",
      );
      const rows = await engagements.listVisible(workspaceId, signal);
      assertActor(current);
      requireAbility(
        access(store(workspaceId), id, current).permissions,
        "changeEngagement",
      );
      return rows
        .filter((row) => row.status === "Active")
        .map((row) => ({
          id: row.id,
          clientDisplayName: row.clientDisplayName,
          engagementName: row.engagementName,
          agreementReference: row.agreementReference,
        }));
    },
    async teamContext(workspaceId, id, signal) {
      const current = await before("projects.teamContext", signal);
      const { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "assignClientPo");
      const expectedVersion = record.detail.version;
      const candidates = record.participants
        .filter(
          (item) =>
            item.kind === "Guest" &&
            item.status === "Active" &&
            item.primaryEmail,
        )
        .map((item) => ({ id: item.id, email: item.primaryEmail ?? "" }));
      const matches = record.detail.engagement
        ? await engagements.clientPoMatches(
            workspaceId,
            record.detail.engagement.id,
            candidates,
            signal,
          )
        : [];
      assertActor(current);
      const latest = access(store(workspaceId), id, current);
      requireAbility(latest.permissions, "assignClientPo");
      if (latest.record.detail.version !== expectedVersion) projectConflict();
      return {
        engagementDefaultParticipantIds: matches.filter((match) =>
          candidates.some((item) => item.id === match),
        ),
      };
    },
    async overviewContext(workspaceId, id, signal) {
      const current = await before("projects.overviewContext", signal);
      const { record } = access(store(workspaceId), id, current);
      const expectedVersion = record.detail.version;
      const engagement =
        record.detail.kind === "Client" && record.detail.engagement
          ? await engagements.getSummary(
              workspaceId,
              record.detail.engagement.id,
              signal,
            )
          : null;
      assertActor(current);
      // Dependency reads can yield; do not return a stale summary or a revoked participant's data.
      const latest = access(store(workspaceId), id, current).record;
      if (latest.detail.version !== expectedVersion) projectConflict();
      return parse(shapes.projectOverviewContext, {
        people: Object.fromEntries(
          MOCK_PEOPLE.map((person) => [person.id, person.displayName]),
        ),
        engagement,
      });
    },
    async creationOptions(workspaceId, signal) {
      const current = await before("projects.creationOptions", signal);
      const rows = current.create
        ? await engagements.listVisible(workspaceId, signal)
        : [];
      assertActor(current);
      return {
        create: current.create,
        engagements: rows
          .filter((row) => row.status === "Active")
          .map((row) => ({
            id: row.id,
            clientDisplayName: row.clientDisplayName,
            engagementName: row.engagementName,
            agreementReference: row.agreementReference,
          })),
      };
    },
    async listMine(workspaceId, signal) {
      const current = await before("projects.listMine", signal);
      return [...store(workspaceId).records.values()]
        .filter((record) =>
          record.participants.some(
            (item) =>
              item.kind === "Member" &&
              item.status === "Active" &&
              item.userId === current.person.id,
          ),
        )
        .map((record) =>
          parse(shapes.projectListItem, present(record, current)),
        );
    },
    async get(workspaceId, id, signal) {
      const current = await before("projects.get", signal),
        { record } = access(store(workspaceId), id, current);
      return parse(shapes.projectDetail, present(record, current));
    },
    async create(workspaceId, input, idempotencyKey) {
      const current = await before("projects.create");
      if (!current.create) projectForbidden();
      const request = parse(shapes.createProjectRequest, input);
      parse(shapes.uuid, idempotencyKey);
      const workspace = store(workspaceId),
        intent = JSON.stringify(request),
        key = `${workspaceId}:${current.person.id}:${idempotencyKey}`;
      const replay = attempts.get(key);
      if (replay) {
        if (replay.intent !== intent) projectConflict();
        const { record } = access(workspace, replay.id, current);
        return present(record, current);
      }
      const engagement =
        request.kind === "Client" && request.engagementId
          ? await activeEngagement(workspaceId, request.engagementId)
          : null;
      assertActor(current);
      // The dependency read can yield; recheck idempotency before committing.
      const raced = attempts.get(key);
      if (raced) {
        if (raced.intent !== intent) projectConflict();
        return present(access(workspace, raced.id, current).record, current);
      }
      const now = new Date().toISOString(),
        id = crypto.randomUUID();
      const creator: Participant = {
        id: crypto.randomUUID(),
        userId: current.person.id,
        displayName: current.person.displayName,
        primaryEmail: current.person.primaryEmail,
        kind: "Member",
        status: "Active",
        roles: ["ProjectAdministrator"],
        firstJoinedAt: now,
        activeSince: now,
        isClientProductOwner: false,
        version: 1,
      };
      const brief: ProjectBrief = {
        projectId: id,
        problem: null,
        objectivesAndSuccessCriteria: null,
        scopeAndExclusions: null,
        assumptions: null,
        constraintsAndDependencies: null,
        openQuestions: null,
        productGoal: null,
        previousProductGoals: [],
        updatedAt: null,
        updatedByUserId: null,
        version: 1,
      };
      const detail: ProjectDetail = {
        id,
        name: request.name,
        purpose: request.purpose,
        kind: request.kind,
        status: "Draft",
        engagement,
        sprintLengthWeeks: 2,
        myRoles: [...creator.roles],
        myParticipantKind: "Member",
        hasActiveAdministrator: true,
        createdAt: now,
        clientProductOwner: null,
        activatedAt: null,
        activatedByUserId: null,
        clientPoWaiverReason: null,
        createdByUserId: current.person.id,
        updatedAt: now,
        version: 1,
        permissions: {
          editBrief: true,
          editStakeholders: true,
          editCadence: true,
          manageParticipants: true,
          manageGuests: true,
          assignClientPo: true,
          activate: true,
          manageAdministrators: true,
          readHistory: true,
          share: true,
          changeEngagement: current.engagementManage,
        },
      };
      const record: ProjectRecord = {
        detail,
        brief,
        participants: [creator],
        invitations: [],
        stakeholders: [],
        events: [],
      };
      recordEvent(record, current, "ProjectCreated", "Project created");
      record.detail.version = 1;
      workspace.records.set(id, record);
      attempts.set(key, { intent, id });
      return present(record, current);
    },
    async history(workspaceId, id, params, signal) {
      const current = await before("projects.history", signal),
        { record, permissions } = access(store(workspaceId), id, current);
      requireAbility(permissions, "readHistory");
      return eventPage(
        record.events,
        params.cursor,
        `${workspaceId}:${id}:${current.person.id}`,
      );
    },
    async listOrphaned(workspaceId, signal) {
      const current = await before("projects.listOrphaned", signal);
      if (!current.owner) projectForbidden();
      return [...store(workspaceId).records.values()]
        .filter((record) => !record.participants.some(activeAdministrator))
        .map((record) => ({
          id: record.detail.id,
          name: record.detail.name,
          status: record.detail.status,
          candidates: record.participants
            .filter(
              (item) =>
                item.kind === "Member" &&
                item.status === "Active" &&
                membership(item.userId),
            )
            .map((item) => ({
              participantId: item.id,
              displayName: item.displayName,
              roles: [...item.roles],
            })),
        }));
    },
    async appointAdministrator(workspaceId, id, input) {
      const current = await before("projects.appointAdministrator");
      if (!current.owner) projectForbidden();
      const request = parse(shapes.appointAdministratorRequest, input),
        record = store(workspaceId).records.get(id);
      if (!record) projectNotFound();
      if (record.participants.some(activeAdministrator))
        projectConflict(
          "This project has an administrator again. No change was made.",
        );
      const target = record.participants.find(
        (item) =>
          item.id === request.participantId &&
          item.kind === "Member" &&
          item.status === "Active" &&
          membership(item.userId),
      );
      if (!target) projectNotFound();
      target.roles.push("ProjectAdministrator");
      target.version++;
      recordEvent(
        record,
        current,
        "ProjectAdministratorAppointed",
        `${target.displayName ?? "Name unavailable"} appointed as project administrator`,
        request.reason,
      );
    },
    ...createMockProjectSettings(store, activeEngagement, sharing),
    ...createMockProjectTeam(store, locate),
    ...createMockProjectInvitations(store),
    ...createMockProjectStakeholders(store, sharing),
    portalList() {
      const current = actor("portal");
      if (epoch !== mockResetVersion()) {
        workspaces.clear();
        attempts.clear();
        epoch = mockResetVersion();
      }
      if (!workspaces.size) store(MOCK_WORKSPACES[0].organizationId);
      return [...workspaces.entries()].flatMap(([workspaceId, workspace]) =>
        [...workspace.records.values()].flatMap((record) => {
          const participant = record.participants.find(
            (row) =>
              row.userId === current.person.id &&
              row.kind === "Guest" &&
              row.status === "Active",
          );
          return participant
            ? [
                {
                  workspaceId,
                  record: structuredClone(record),
                  participant: structuredClone(participant),
                },
              ]
            : [];
        }),
      );
    },
    portalSnapshot(id) {
      const matches = this.portalList().filter(
        (row) => row.record.detail.id === id,
      );
      if (matches.length !== 1) projectNotFound();
      const found = matches[0];
      if (!found) projectNotFound();
      return found;
    },
    portalPreviewSnapshot(workspaceId, id) {
      const { record, participant, permissions } = access(
        store(workspaceId),
        id,
        actor(),
      );
      requireAbility(permissions, "share");
      return {
        workspaceId,
        record: structuredClone(record),
        participant: structuredClone(participant),
      };
    },
    async portalUpdateBrief(id, input) {
      const current = await before("portal.updateBrief", undefined, "portal");
      const request = parse(shapes.updateBriefItemRequest, input);
      const workspace = locate(id, current),
        { record, participant, permissions } = access(
          workspace,
          id,
          current,
          true,
        );
      if (participant.kind !== "Guest") projectNotFound();
      requireAbility(permissions, "editBrief");
      if (record.brief.version !== request.expectedVersion) projectConflict();
      const fields = {
        Problem: "problem",
        ObjectivesAndSuccessCriteria: "objectivesAndSuccessCriteria",
        ScopeAndExclusions: "scopeAndExclusions",
        Assumptions: "assumptions",
        ConstraintsAndDependencies: "constraintsAndDependencies",
        OpenQuestions: "openQuestions",
        ProductGoal: "productGoal",
      } as const;
      if (
        request.item === "ProductGoal" &&
        record.brief.productGoal &&
        record.brief.productGoal !== request.value?.trim()
      ) {
        record.brief.previousProductGoals.unshift({
          value: record.brief.productGoal,
          replacedAt: new Date().toISOString(),
          replacedByUserId: current.person.id,
        });
      }
      record.brief[fields[request.item]] = request.value?.trim() || null;
      record.brief.version++;
      record.brief.updatedAt = new Date().toISOString();
      record.brief.updatedByUserId = current.person.id;
      recordEvent(
        record,
        current,
        request.item === "ProductGoal"
          ? "ProductGoalChanged"
          : "BriefItemChanged",
        request.item === "ProductGoal"
          ? "Product Goal changed"
          : `${request.item} updated`,
      );
    },
    async portalUpdateStakeholder(id, stakeholderId, input) {
      const current = await before(
          "portal.updateStakeholder",
          undefined,
          "portal",
        ),
        { record, participant, permissions } = access(
          locate(id, current),
          id,
          current,
          true,
        );
      if (participant.kind !== "Guest") projectNotFound();
      requireAbility(permissions, "editStakeholders");
      const target = record.stakeholders.find(
        (row) => row.id === stakeholderId && !row.retiredAt,
      );
      if (!target) projectNotFound();
      const request = parse(shapes.saveStakeholderRequest, {
        ...input,
        email: null,
        participantId: null,
      });
      if (target.version !== request.version) projectConflict();
      Object.assign(target, {
        name: request.name,
        side: request.side,
        organizationName:
          target.side === "Vendor" && request.side === "Vendor"
            ? target.organizationName
            : request.organizationName,
        responsibilities: request.responsibilities,
        decisionAreas: request.decisionAreas,
        version: target.version + 1,
      });
      recordEvent(record, current, "StakeholderSaved", "Stakeholder saved");
    },
    sharingSnapshot(workspaceId, id) {
      const current = actor(),
        { record } = access(store(workspaceId), id, current);
      return {
        project: present(record, current),
        brief: structuredClone(record.brief),
        stakeholders: structuredClone(record.stakeholders),
      };
    },
    linkedProjectProjection(workspaceId, engagementId) {
      const current = actor();
      return [...store(workspaceId).records.values()]
        .filter((row) => row.detail.engagement?.id === engagementId)
        .map((row) => ({
          projectId: row.detail.id,
          name: row.detail.name,
          status: row.detail.status,
          administratorNames: row.participants
            .filter(activeAdministrator)
            .map((person) => person.displayName),
          callerParticipates: row.participants.some(
            (person) =>
              person.userId === current.person.id &&
              person.status === "Active" &&
              person.kind === "Member",
          ),
        }));
    },
  };
}
