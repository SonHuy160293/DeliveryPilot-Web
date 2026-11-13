import type { z } from "zod";
import { ApiError } from "@/lib/api/apiError";
import {
  delay,
  resolveMockPersona,
  checkMockFailure,
  mockResetVersion,
} from "@/mocks/mockRuntime";
import {
  MOCK_WORKSPACES,
  MOCK_PEOPLE,
  type MockWorkspace,
} from "@/mocks/people";
import {
  projectConflict,
  projectForbidden,
  projectNotFound,
} from "@/features/projects/api/projectErrors";
import type {
  Participant,
  ProjectDetail,
  ProjectBrief,
  ProjectEvent,
  GuestInvitation,
  Stakeholder,
  ProjectPermissions,
} from "@/features/projects/api/types";
import { computeReadiness } from "@/features/projects/model/readiness";
export interface ProjectRecord {
  detail: ProjectDetail;
  brief: ProjectBrief;
  participants: Participant[];
  invitations: GuestInvitation[];
  stakeholders: Stakeholder[];
  events: ProjectEvent[];
}
export interface ProjectWorkspace {
  records: Map<string, ProjectRecord>;
}
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
const workspaces: readonly MockWorkspace[] = MOCK_WORKSPACES;
export function actor(surface: "workspace" | "portal" = "workspace") {
  const person = resolveMockPersona(surface);
  const membership = workspaces[0]?.members.find(
    (member) => member.userKey === person.key,
  );
  const codes = membership?.permissionCodes ?? [];
  return {
    person,
    epoch: mockResetVersion(),
    create: codes.includes("organization.projects.create"),
    engagementManage: codes.includes("organization.engagements.manage"),
    owner: membership?.roles.includes("Owner") === true,
  };
}
export type ProjectActor = ReturnType<typeof actor>;
export function assertActor(current: ProjectActor) {
  if (
    current.epoch !== mockResetVersion() ||
    actor().person.key !== current.person.key
  )
    throw new ApiError("cancelled", "The request was cancelled.");
}
export async function before(
  operation: string,
  signal?: AbortSignal,
  surface: "workspace" | "portal" = "workspace",
) {
  const current = actor(surface),
    epoch = mockResetVersion();
  if (signal?.aborted)
    throw new ApiError("cancelled", "The request was cancelled.");
  await delay();
  if (
    signal?.aborted ||
    epoch !== mockResetVersion() ||
    actor(surface).person.key !== current.person.key
  )
    throw new ApiError("cancelled", "The request was cancelled.");
  try {
    checkMockFailure("projects.identity");
  } catch (error) {
    if (error instanceof ApiError)
      throw new ApiError(error.kind, error.message, {
        ...error.details,
        code: "Identity.Unavailable",
      });
    throw error;
  }
  checkMockFailure(operation);
  return current;
}
export function membership(userId: string) {
  const person = MOCK_PEOPLE.find((item) => item.id === userId);
  return person &&
    workspaces[0]?.members.some((member) => member.userKey === person.key)
    ? person
    : undefined;
}
export const activeAdministrator = (participant: Participant) =>
  participant.kind === "Member" &&
  participant.status === "Active" &&
  participant.roles.includes("ProjectAdministrator");
export function abilities(
  record: ProjectRecord,
  participant: Participant,
  current: ProjectActor,
): ProjectPermissions {
  const member = participant.kind === "Member",
    pa = member && participant.roles.includes("ProjectAdministrator"),
    pm = participant.roles.includes("ProjectManager"),
    ba = participant.roles.includes("BusinessAnalyst");
  return {
    editBrief: pa || pm || ba,
    editStakeholders: pa || pm,
    editCadence: member && (pa || pm),
    manageParticipants: member && (pa || pm),
    manageGuests: member && (pa || pm),
    assignClientPo: pa,
    activate: pa && record.detail.status === "Draft",
    manageAdministrators: pa,
    readHistory: member && (pa || pm),
    share: member && (pa || pm),
    changeEngagement:
      pa && current.engagementManage && record.detail.status === "Draft",
  };
}
export function access(
  workspace: ProjectWorkspace,
  id: string,
  current: ProjectActor,
  guests = false,
) {
  const record = workspace.records.get(id);
  const participant = record?.participants.find(
    (item) =>
      item.userId === current.person.id &&
      item.status === "Active" &&
      (guests || item.kind === "Member"),
  );
  if (!record || !participant) projectNotFound();
  return {
    record,
    participant,
    permissions: abilities(record, participant, current),
  };
}
export function present(
  record: ProjectRecord,
  current: ProjectActor,
): ProjectDetail {
  const participant = record.participants.find(
    (item) =>
      item.status === "Active" &&
      item.kind === "Member" &&
      item.userId === current.person.id,
  );
  if (!participant) projectNotFound();
  const row = structuredClone(record.detail);
  delete row.missingSetupCount;
  row.myRoles = [...participant.roles];
  row.myParticipantKind = participant.kind;
  row.hasActiveAdministrator = record.participants.some(activeAdministrator);
  row.permissions = abilities(record, participant, current);
  if (
    row.status === "Draft" &&
    participant.roles.includes("ProjectAdministrator")
  )
    row.missingSetupCount = computeReadiness(
      row,
      record.brief,
      record.participants,
    ).length;
  return row;
}
export function requireAbility(
  permissions: ProjectPermissions,
  key: keyof ProjectPermissions,
) {
  if (!permissions[key]) projectForbidden();
}
export function checkVersion(actual: number, expected: number) {
  if (actual !== expected) projectConflict();
}
export function recordEvent(
  record: ProjectRecord,
  current: ProjectActor,
  eventType: string,
  summary: string,
  reason: string | null = null,
) {
  const now = new Date().toISOString();
  record.detail.version++;
  record.detail.updatedAt = now;
  record.events.unshift({
    id: crypto.randomUUID(),
    eventType,
    summary,
    actorUserId: current.person.id,
    actorDisplayName: current.person.displayName,
    occurredAt: now,
    reason,
  });
}
export function preserveAdministrator(
  record: ProjectRecord,
  target: Participant,
  keepsAdministrator: boolean,
) {
  if (
    activeAdministrator(target) &&
    !keepsAdministrator &&
    record.participants.filter(activeAdministrator).length <= 1
  )
    projectConflict(
      "A project needs at least one administrator. Make someone else an administrator first.",
    );
}
export function clearPo(record: ProjectRecord, target: Participant) {
  if (record.detail.clientProductOwner?.participantId === target.id)
    record.detail.clientProductOwner = null;
  target.isClientProductOwner = false;
}
export function eventPage(
  items: readonly ProjectEvent[],
  cursor: string | null | undefined,
  tag: string,
) {
  let offset = 0;
  if (cursor) {
    let decoded: unknown;
    try {
      decoded = JSON.parse(atob(cursor));
    } catch {
      throw new ApiError("bad-request", "Choose a current page.", {
        status: 400,
      });
    }
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("tag" in decoded) ||
      decoded.tag !== tag ||
      !("after" in decoded) ||
      typeof decoded.after !== "string"
    )
      throw new ApiError("bad-request", "Choose a current page.", {
        status: 400,
      });
    offset = items.findIndex((item) => item.id === decoded.after) + 1;
    if (!offset)
      throw new ApiError("bad-request", "Choose a current page.", {
        status: 400,
      });
  }
  const selected = items.slice(offset, offset + 50),
    last = selected.at(-1);
  return {
    items: structuredClone(selected),
    nextCursor:
      offset + selected.length < items.length && last
        ? btoa(JSON.stringify({ tag, after: last.id }))
        : null,
  };
}
