import type { EngagementRepository } from "@/features/engagements/api/engagementRepository";
import type {
  EngagementDetail,
  EngagementHistoryEntry,
  CreateEngagementResult,
  EngagementSummary,
} from "@/features/engagements/api/types";
import * as shapes from "@/features/engagements/api/contracts";
import {
  before,
  conflict,
  forbidden,
  notFound,
  page,
  parse,
} from "@/features/engagements/api/mockSupport";
import { createMockWrites } from "@/features/engagements/api/mockWrites";
import {
  engagementFixtures,
  engagementHistoryFixtures,
} from "@/mocks/engagements";
import { mockResetVersion } from "@/mocks/mockRuntime";
import { MOCK_PEOPLE } from "@/mocks/people";
import { ApiError } from "@/lib/api/apiError";

export interface EngagementStore {
  rows: EngagementDetail[];
  history: Map<string, EngagementHistoryEntry[]>;
  attempts: Map<string, { intent: string; result: CreateEngagementResult }>;
}
interface ProjectSummaryBridge {
  validateMockClientLink(workspaceId: string, id: string): void;
  applyMockClientLink(
    workspaceId: string,
    id: string,
    clientWorkspaceId: string | null,
    actorId: string,
  ): void;
  projectClientPoMatches(
    workspaceId: string,
    id: string,
    candidates: readonly { id: string; email: string }[],
    signal?: AbortSignal,
  ): Promise<string[]>;
  /** Internal mock bridge: the project repository must first authorize active participation. */
  projectSummary(
    workspaceId: string,
    id: string,
    signal?: AbortSignal,
  ): Promise<{ summary: EngagementSummary; canOpenFullDetail: boolean }>;
}
export function createMockEngagementRepository(): EngagementRepository &
  ProjectSummaryBridge {
  let generation = mockResetVersion();
  const stores = new Map<string, EngagementStore>();
  function store(workspaceId: string): EngagementStore {
    parse(shapes.uuid, workspaceId);
    if (generation !== mockResetVersion()) {
      stores.clear();
      generation = mockResetVersion();
    }
    let current = stores.get(workspaceId);
    if (!current) {
      const rows = structuredClone(engagementFixtures.items).map((row) => ({
        ...row,
        organizationId: workspaceId,
      }));
      const first = rows[0];
      current = {
        rows,
        history: new Map(
          first
            ? [[first.id, structuredClone(engagementHistoryFixtures.items)]]
            : [],
        ),
        attempts: new Map(),
      };
      stores.set(workspaceId, current);
    }
    return current;
  }
  const writes = createMockWrites(store);
  return {
    kind: "mock",
    validateMockClientLink(workspaceId, id) {
      const row = store(workspaceId).rows.find((item) => item.id === id);
      if (
        !row ||
        row.status !== "Active" ||
        row.clientOrganizationId ||
        !row.hasOutstandingLinkCode
      )
        throw new ApiError(
          "validation",
          "This code can't be used. Ask the vendor for a new code.",
          { status: 422, code: "ClientLink.Invalid" },
        );
    },
    applyMockClientLink(workspaceId, id, clientWorkspaceId, actorId) {
      const row = store(workspaceId).rows.find((item) => item.id === id);
      if (!row) notFound();
      if (
        clientWorkspaceId &&
        (row.status !== "Active" ||
          row.clientOrganizationId ||
          !row.hasOutstandingLinkCode)
      )
        conflict();
      row.clientOrganizationId = clientWorkspaceId;
      row.clientLinkedAt = clientWorkspaceId ? new Date().toISOString() : null;
      row.clientLinkedByUserId = clientWorkspaceId ? actorId : null;
      row.hasOutstandingLinkCode = false;
      row.linkCodeExpiresAt = null;
      row.version++;
      row.updatedAt = new Date().toISOString();
    },
    async projectClientPoMatches(workspaceId, id, candidates, signal) {
      await before("engagements.projectClientPoMatches", signal);
      const row = store(workspaceId).rows.find((item) => item.id === id);
      if (!row) notFound();
      const emails = new Set(
        row.contacts
          .filter((contact) => contact.contactRole === "ClientProductOwner")
          .map((contact) => contact.email.trim().toLowerCase()),
      );
      return candidates
        .filter((candidate) => emails.has(candidate.email.trim().toLowerCase()))
        .map((candidate) => candidate.id);
    },
    async projectSummary(workspaceId, id, signal) {
      parse(shapes.uuid, id);
      const actor = await before("engagements.projectSummary", signal);
      const row = store(workspaceId).rows.find((item) => item.id === id);
      if (!row) notFound();
      return {
        summary: parse(shapes.engagementSummary, {
          engagementId: row.id,
          clientDisplayName: row.clientDisplayName,
          engagementName: row.engagementName,
          agreementReference: row.agreementReference,
          status: row.status,
          milestones: row.milestones,
        }),
        canOpenFullDetail:
          actor.readAll || row.createdByUserId === actor.person.id,
      };
    },
    async capabilities() {
      return { create: (await before("engagements.capabilities")).create };
    },
    async detailCapabilities() {
      const actor = await before("engagements.detailCapabilities");
      return {
        manage: actor.manage,
        createProject: actor.createProject,
        people: Object.fromEntries(
          MOCK_PEOPLE.map((person) => [person.id, person.displayName]),
        ),
      };
    },
    async list(workspaceId, input, signal) {
      const actor = await before("engagements.list", signal);
      const params = parse(shapes.listParams, input);
      const visible = store(workspaceId).rows.filter(
        (row) =>
          (actor.readAll || row.createdByUserId === actor.person.id) &&
          (!params.status || row.status === params.status),
      );
      return parse(
        shapes.engagementPage,
        page(
          visible,
          { limit: params.limit, cursor: params.cursor },
          `${workspaceId}:${actor.person.id}:${params.status ?? "all"}`,
        ),
      );
    },
    async get(workspaceId, id, signal) {
      parse(shapes.uuid, id);
      const actor = await before("engagements.get", signal);
      const row = store(workspaceId).rows.find((item) => item.id === id);
      if (!row || (!actor.readAll && row.createdByUserId !== actor.person.id))
        notFound();
      return parse(shapes.engagementDetail, structuredClone(row));
    },
    async history(workspaceId, id, params, signal) {
      parse(shapes.uuid, id);
      const actor = await before("engagements.history", signal);
      const data = store(workspaceId);
      const row = data.rows.find((item) => item.id === id);
      if (!row || (!actor.readAll && row.createdByUserId !== actor.person.id))
        notFound();
      return parse(
        shapes.historyPage,
        page(
          data.history.get(id) ?? [],
          params,
          `${workspaceId}:${actor.person.id}:${id}`,
        ),
      );
    },
    async create(workspaceId, input, idempotencyKey) {
      const actor = await before("engagements.create");
      if (!actor.create) forbidden();
      parse(shapes.uuid, idempotencyKey);
      const request = parse(shapes.createEngagementRequest, input);
      const data = store(workspaceId);
      const intent = JSON.stringify({
        ...request,
        clientLegalName: request.clientLegalName ?? null,
        clientCountryCode: request.clientCountryCode ?? null,
        engagementName: request.engagementName ?? null,
        documentUrl: request.documentUrl ?? null,
      });
      const key = `${actor.person.id}:${idempotencyKey}`;
      const existing = data.attempts.get(key);
      if (existing) {
        if (existing.intent !== intent) conflict();
        return parse(shapes.createEngagementResult, {
          ...structuredClone(existing.result),
          isReplay: true,
        });
      }
      const at = new Date().toISOString();
      const duplicate = data.rows.some(
        (row) =>
          row.status === "Active" &&
          row.agreementReference.toLocaleLowerCase() ===
            request.agreementReference.toLocaleLowerCase(),
      );
      const row: EngagementDetail = {
        id: crypto.randomUUID(),
        organizationId: workspaceId,
        ...request,
        clientLegalName: request.clientLegalName ?? null,
        clientCountryCode: request.clientCountryCode ?? null,
        engagementName: request.engagementName ?? null,
        documentUrl: request.documentUrl ?? null,
        contractAmount: null,
        contractCurrency: null,
        plannedEffortPersonDays: null,
        status: "Active",
        closedAt: null,
        closedByUserId: null,
        clientOrganizationId: null,
        clientLinkedAt: null,
        clientLinkedByUserId: null,
        hasOutstandingLinkCode: false,
        linkCodeExpiresAt: null,
        createdByUserId: actor.person.id,
        createdAt: at,
        updatedAt: at,
        version: 1,
        contacts: [],
        milestones: [],
      };
      const result = parse(shapes.createEngagementResult, {
        snapshot: { ...row, duplicateAgreementReference: duplicate },
        isReplay: false,
      });
      data.rows.push(parse(shapes.engagementDetail, row));
      data.history.set(row.id, [
        {
          id: crypto.randomUUID(),
          eventType: "EngagementCreated",
          subjectType: "Engagement",
          subjectId: row.id,
          actorUserId: actor.person.id,
          actorOrganizationId: workspaceId,
          occurredAt: at,
          reason: null,
          details: {},
          engagementVersion: 1,
        },
      ]);
      data.attempts.set(key, { intent, result: structuredClone(result) });
      return structuredClone(result);
    },
    ...writes,
  };
}
export const mockEngagementRepository = createMockEngagementRepository();
