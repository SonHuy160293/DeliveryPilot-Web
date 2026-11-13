import type { SharingRepository } from "@/features/sharing/api/sharingRepository";
import type {
  GuestShare,
  ShareableItem,
  SharingProjectAdapter,
} from "@/features/sharing/api/types";
import {
  before,
  sharingError,
  parse,
  eventPage,
} from "@/features/sharing/api/mockSupport";
import { shareableItem, withdrawal } from "@/features/sharing/api/contracts";
import {
  createMockShareStore,
  mockShareStore,
} from "@/features/sharing/api/mockShareStore";
import { SHARE_BRIEF_ITEMS } from "@/features/sharing/model/items";
import { MOCK_PEOPLE } from "@/mocks/people";
export function createMockSharingRepository(
  adapter: SharingProjectAdapter,
  store: ReturnType<typeof createMockShareStore> = mockShareStore,
): SharingRepository {
  function read(wid: string, id: string, manage = false) {
    const result = adapter.read(wid, id);
    if (result.project.myParticipantKind !== "Member")
      sharingError("not-found");
    if (manage && !result.project.permissions.share) sharingError("forbidden");
    return result;
  }
  async function fullEngagement(wid: string, id: string) {
    const old = read(wid, id, true).project;
    if (
      old.kind !== "Client" ||
      !old.engagement ||
      !(await adapter.canReadEngagement(wid, id))
    )
      sharingError("forbidden");
    const latest = read(wid, id, true).project;
    if (latest.kind !== "Client" || latest.engagement?.id !== old.engagement.id)
      sharingError("conflict");
    return old.engagement.id;
  }
  function label(wid: string, id: string, item: ShareableItem) {
    const snapshot = read(wid, id, true);
    if (item.itemType === "BriefItem")
      return (
        SHARE_BRIEF_ITEMS.find((row) => row.code === item.briefItemCode)
          ?.label ?? sharingError("not-found")
      );
    if (item.itemType === "EngagementSummary") return "Engagement summary";
    const stakeholder = snapshot.stakeholders.find(
      (row) => row.id === item.stakeholderId,
    );
    if (!stakeholder) sharingError("not-found");
    if (stakeholder.retiredAt) sharingError("conflict");
    return stakeholder.name;
  }
  return {
    kind: "mock",
    async list(wid, id, signal) {
      await before("sharing.list", signal);
      read(wid, id);
      return structuredClone(store.project(wid, id).shares);
    },
    async context(wid, id, signal) {
      const current = await before("sharing.context", signal);
      const initial = read(wid, id, true);
      const canShareEngagement =
        initial.project.kind === "Client" &&
        !!initial.project.engagement &&
        (await adapter.canReadEngagement(wid, id, signal));
      current.assert();
      const latest = read(wid, id, true);
      if (latest.project.version !== initial.project.version)
        sharingError("conflict");
      return {
        ...latest,
        canShareEngagement,
        people: Object.fromEntries(
          MOCK_PEOPLE.map((person) => [person.id, person.displayName]),
        ),
      };
    },
    async share(wid, id, input) {
      const current = await before("sharing.share"),
        item = parse(shareableItem, input);
      read(wid, id, true);
      const engagementId =
        item.itemType === "EngagementSummary"
          ? await fullEngagement(wid, id)
          : null;
      current.assert();
      const itemLabel = label(wid, id, item),
        state = store.project(wid, id);
      let row = state.shares.find(
        (row) =>
          row.itemType === item.itemType &&
          row.briefItemCode === (item.briefItemCode ?? null) &&
          row.stakeholderId === (item.stakeholderId ?? null) &&
          row.engagementId === engagementId,
      );
      if (row?.status === "Shared") return structuredClone(row);
      const now = new Date().toISOString();
      if (row)
        Object.assign(row, {
          status: "Shared",
          sharedAt: now,
          sharedByUserId: current.person.id,
          withdrawnAt: null,
          version: row.version + 1,
        });
      else {
        row = {
          id: crypto.randomUUID(),
          itemType: item.itemType,
          briefItemCode: item.briefItemCode ?? null,
          stakeholderId: item.stakeholderId ?? null,
          engagementId,
          status: "Shared",
          sharedAt: now,
          sharedByUserId: current.person.id,
          withdrawnAt: null,
          version: 1,
        } satisfies GuestShare;
        state.shares.push(row);
      }
      state.history.unshift({
        id: crypto.randomUUID(),
        action: "Shared",
        itemType: item.itemType,
        itemLabel,
        actorUserId: current.person.id,
        actorDisplayName: current.person.displayName,
        occurredAt: now,
        reason: null,
      });
      return structuredClone(row);
    },
    async withdraw(wid, id, shareId, input) {
      const current = await before("sharing.withdraw"),
        request = parse(withdrawal, input);
      read(wid, id, true);
      const state = store.project(wid, id),
        row = state.shares.find((row) => row.id === shareId);
      if (!row) sharingError("not-found");
      if (row.itemType === "EngagementSummary") await fullEngagement(wid, id);
      current.assert();
      read(wid, id, true);
      if (row.version !== request.expectedVersion) sharingError("conflict");
      if (row.status === "Withdrawn") return structuredClone(row);
      const itemLabel = label(wid, id, {
        itemType: row.itemType,
        briefItemCode: row.briefItemCode ?? undefined,
        stakeholderId: row.stakeholderId ?? undefined,
      });
      const now = new Date().toISOString();
      row.status = "Withdrawn";
      row.withdrawnAt = now;
      row.version++;
      state.history.unshift({
        id: crypto.randomUUID(),
        action: "Withdrawn",
        itemType: row.itemType,
        itemLabel,
        actorUserId: current.person.id,
        actorDisplayName: current.person.displayName,
        occurredAt: now,
        reason: request.reason || null,
      });
      return structuredClone(row);
    },
    async history(wid, id, params, signal) {
      await before("sharing.history", signal);
      read(wid, id, true);
      return eventPage(
        store.project(wid, id).history,
        params.cursor,
        JSON.stringify([wid, id]),
      );
    },
  };
}
