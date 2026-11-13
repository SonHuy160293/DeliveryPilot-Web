import type { EngagementRepository } from "@/features/engagements/api/engagementRepository";
import type { EngagementStore } from "@/features/engagements/api/mockEngagementRepository";
import type {
  EngagementDetail,
  EngagementMilestone,
} from "@/features/engagements/api/types";
import * as shapes from "@/features/engagements/api/contracts";
import {
  before,
  conflict,
  forbidden,
  notFound,
  parse,
} from "@/features/engagements/api/mockSupport";
import { ApiError } from "@/lib/api/apiError";
import { mockLinkState } from "@/features/engagements/api/mockLinkState";

type Writes = Pick<
  EngagementRepository,
  | "setContractValue"
  | "close"
  | "reopen"
  | "addMilestone"
  | "editMilestone"
  | "changeMilestoneDate"
  | "changeMilestoneStatus"
  | "updateDetails"
  | "upsertContact"
  | "removeContact"
  | "removeClientLink"
>;
export function createMockWrites(
  store: (workspaceId: string) => EngagementStore,
): Writes {
  async function edit(
    workspaceId: string,
    id: string,
    expected: number | undefined,
    operation: string,
    allowClosed = false,
  ) {
    const actor = await before(operation);
    if (!actor.manage) forbidden();
    parse(shapes.uuid, id);
    const row = store(workspaceId).rows.find((item) => item.id === id);
    if (!row) notFound();
    if (expected !== undefined && row.version !== expected) conflict();
    if (row.status === "Closed" && !allowClosed) conflict();
    return { row, actor };
  }
  function record(
    row: EngagementDetail,
    actorId: string,
    eventType: string,
    reason: string | null,
    subject?: EngagementMilestone,
    details: Record<string, unknown> = {},
    incrementSubject = true,
  ) {
    const now = new Date().toISOString();
    row.version++;
    row.updatedAt = now;
    if (subject && incrementSubject) {
      subject.version++;
      subject.updatedAt = now;
    }
    const items = store(row.organizationId).history.get(row.id) ?? [];
    items.unshift({
      id: crypto.randomUUID(),
      eventType,
      subjectType: subject ? "Milestone" : "Engagement",
      subjectId: subject?.id ?? row.id,
      actorUserId: actorId,
      actorOrganizationId: row.organizationId,
      occurredAt: now,
      reason,
      details,
      engagementVersion: row.version,
    });
    store(row.organizationId).history.set(row.id, items);
  }
  function milestone(row: EngagementDetail, id: string, expected: number) {
    const item = row.milestones.find((value) => value.id === id);
    if (!item) notFound();
    if (item.version !== expected) conflict();
    return item;
  }
  return {
    async removeClientLink(workspaceId, id, expectedVersion, reason) {
      parse(shapes.version, expectedVersion);
      if (reason !== null) parse(shapes.reason, reason);
      const { row, actor } = await edit(
        workspaceId,
        id,
        expectedVersion,
        "engagements.removeClientLink",
        true,
      );
      if (!row.clientOrganizationId) conflict();
      mockLinkState.disconnectSource(workspaceId, id);
      row.clientOrganizationId = null;
      row.clientLinkedAt = null;
      row.clientLinkedByUserId = null;
      record(row, actor.person.id, "ClientLinkRemoved", reason);
      return structuredClone(row);
    },
    async updateDetails(workspaceId, id, input) {
      const request = parse(shapes.updateEngagementDetailsRequest, input);
      const { row, actor } = await edit(
        workspaceId,
        id,
        request.expectedVersion,
        "engagements.updateDetails",
      );
      if (
        (request.agreementReference !== row.agreementReference ||
          request.agreementSignedOn !== row.agreementSignedOn) &&
        !request.reason?.trim()
      )
        throw new ApiError("validation", "Check the highlighted fields.", {
          status: 422,
          fieldErrors: { reason: ["Enter a reason."] },
        });
      Object.assign(row, {
        clientDisplayName: request.clientDisplayName,
        clientLegalName: request.clientLegalName ?? null,
        clientCountryCode: request.clientCountryCode ?? null,
        engagementName: request.engagementName ?? null,
        agreementReference: request.agreementReference,
        agreementSignedOn: request.agreementSignedOn,
        documentUrl: request.documentUrl ?? null,
      });
      record(row, actor.person.id, "EngagementUpdated", request.reason);
      return structuredClone(row);
    },
    async upsertContact(workspaceId, id, contactId, input) {
      const request = parse(shapes.upsertContactRequest, input),
        { row, actor } = await edit(
          workspaceId,
          id,
          request.expectedVersion,
          "engagements.upsertContact",
        );
      let contact = row.contacts.find((item) => item.id === contactId);
      if (contactId && !contact) notFound();
      const now = new Date().toISOString();
      if (request.contactRole === "ClientProductOwner")
        for (const other of row.contacts)
          if (
            other.contactRole === "ClientProductOwner" &&
            other.id !== contactId
          ) {
            other.contactRole = "Other";
            other.version++;
            other.updatedAt = now;
          }
      if (contact) {
        contact.name = request.name;
        contact.email = request.email;
        contact.contactRole = request.contactRole;
        contact.version++;
        contact.updatedAt = now;
      } else {
        contact = {
          id: crypto.randomUUID(),
          name: request.name,
          email: request.email,
          contactRole: request.contactRole,
          createdByUserId: actor.person.id,
          createdAt: now,
          updatedAt: now,
          version: 1,
        };
        row.contacts.push(contact);
      }
      record(row, actor.person.id, "ContactSaved", null);
      return structuredClone(row);
    },
    async removeContact(workspaceId, id, contactId, expectedVersion) {
      parse(shapes.version, expectedVersion);
      const { row, actor } = await edit(
        workspaceId,
        id,
        expectedVersion,
        "engagements.removeContact",
      );
      const index = row.contacts.findIndex((item) => item.id === contactId);
      if (index < 0) notFound();
      row.contacts.splice(index, 1);
      record(row, actor.person.id, "ContactRemoved", null);
      return structuredClone(row);
    },
    async setContractValue(workspaceId, id, input) {
      const request = parse(shapes.setContractValueRequest, input);
      const { row, actor } = await edit(
        workspaceId,
        id,
        request.expectedVersion,
        "engagements.setContractValue",
      );
      if (
        row.contractAmount !== null &&
        row.contractCurrency !== request.contractCurrency &&
        !(request.contractAmount === null && request.contractCurrency === null)
      )
        throw new ApiError("validation", "Check the highlighted fields.", {
          status: 422,
          fieldErrors: {
            contractCurrency: ["Clear the amount before changing currency."],
          },
        });
      const details = {
        previousContractAmount: row.contractAmount,
        newContractAmount: request.contractAmount,
        previousContractCurrency: row.contractCurrency,
        newContractCurrency: request.contractCurrency,
        previousPlannedEffortPersonDays: row.plannedEffortPersonDays,
        newPlannedEffortPersonDays: request.plannedEffortPersonDays,
      };
      row.contractAmount = request.contractAmount;
      row.contractCurrency = request.contractCurrency;
      row.plannedEffortPersonDays = request.plannedEffortPersonDays;
      record(
        row,
        actor.person.id,
        "ContractValueChanged",
        request.reason,
        undefined,
        details,
      );
      return structuredClone(row);
    },
    async close(workspaceId, id, input) {
      const request = parse(shapes.closeOrReopenRequest, input);
      const { row, actor } = await edit(
        workspaceId,
        id,
        request.expectedVersion,
        "engagements.close",
      );
      row.status = "Closed";
      row.closedAt = new Date().toISOString();
      row.closedByUserId = actor.person.id;
      record(row, actor.person.id, "EngagementClosed", request.reason);
      return structuredClone(row);
    },
    async reopen(workspaceId, id, input) {
      const request = parse(shapes.closeOrReopenRequest, input);
      const { row, actor } = await edit(
        workspaceId,
        id,
        request.expectedVersion,
        "engagements.reopen",
        true,
      );
      if (row.status !== "Closed") conflict();
      row.status = "Active";
      row.closedAt = null;
      row.closedByUserId = null;
      record(row, actor.person.id, "EngagementReopened", request.reason);
      return structuredClone(row);
    },
    async addMilestone(workspaceId, id, input) {
      const request = parse(shapes.addMilestoneRequest, input);
      const { row, actor } = await edit(
        workspaceId,
        id,
        request.expectedVersion,
        "engagements.addMilestone",
      );
      const now = new Date().toISOString();
      const item: EngagementMilestone = {
        id: crypto.randomUUID(),
        name: request.name,
        description: request.description,
        originalTargetDate: request.targetDate,
        currentTargetDate: request.targetDate,
        status: "Planned",
        createdByUserId: actor.person.id,
        createdAt: now,
        updatedAt: now,
        version: 1,
      };
      row.milestones.push(item);
      record(row, actor.person.id, "MilestoneAdded", null, item, {}, false);
      return structuredClone(item);
    },
    async editMilestone(workspaceId, id, milestoneId, input) {
      const request = parse(shapes.editMilestoneRequest, input);
      const { row, actor } = await edit(
        workspaceId,
        id,
        undefined,
        "engagements.editMilestone",
      );
      const item = milestone(row, milestoneId, request.expectedVersion);
      if (item.status !== "Planned" && item.status !== "Missed") conflict();
      const details = {
        previousName: item.name,
        newName: request.name,
        previousDescription: item.description,
        newDescription: request.description,
      };
      item.name = request.name;
      item.description = request.description;
      record(row, actor.person.id, "MilestoneEdited", null, item, details);
      return structuredClone(item);
    },
    async changeMilestoneDate(workspaceId, id, milestoneId, input) {
      const request = parse(shapes.changeMilestoneDateRequest, input);
      const { row, actor } = await edit(
        workspaceId,
        id,
        undefined,
        "engagements.changeMilestoneDate",
      );
      const item = milestone(row, milestoneId, request.expectedVersion);
      if (item.status !== "Planned" && item.status !== "Missed") conflict();
      const details = {
        previousTargetDate: item.currentTargetDate,
        newTargetDate: request.targetDate,
      };
      item.currentTargetDate = request.targetDate;
      record(
        row,
        actor.person.id,
        "MilestoneDateChanged",
        request.reason,
        item,
        details,
      );
      return structuredClone(item);
    },
    async changeMilestoneStatus(workspaceId, id, milestoneId, input) {
      const request = parse(shapes.changeMilestoneStatusRequest, input);
      const { row, actor } = await edit(
        workspaceId,
        id,
        undefined,
        "engagements.changeMilestoneStatus",
      );
      const item = milestone(row, milestoneId, request.expectedVersion);
      if (!(
        item.status === "Planned" ||
        (item.status === "Missed" && request.status !== "Missed")
      ))
        conflict();
      const details = {
        previousStatus: item.status,
        newStatus: request.status,
      };
      item.status = request.status;
      record(
        row,
        actor.person.id,
        "MilestoneStatusChanged",
        request.reason,
        item,
        details,
      );
      return structuredClone(item);
    },
  };
}
