import { mockResetVersion } from "@/mocks/mockRuntime";
import {
  mockLinkCode,
  mockLinkPreview,
  mockLinkedEngagements,
  mockLinkSource,
} from "@/mocks/clientLinks";
import type {
  LinkPreview,
  LinkedEngagement,
} from "@/features/engagements/api/types";
import { ApiError } from "@/lib/api/apiError";
interface Outstanding {
  workspaceId: string;
  engagementId: string;
  expiresAt: string;
  preview: LinkPreview;
}
let epoch = mockResetVersion(),
  issued: Outstanding | undefined = {
    ...mockLinkSource,
    preview: mockLinkPreview,
  },
  used = false;
const scopes = new Map<string, LinkedEngagement[]>();
const bindings = new Map<string, Outstanding>();
function resetIfNeeded() {
  if (epoch !== mockResetVersion()) {
    epoch = mockResetVersion();
    scopes.clear();
    bindings.clear();
    issued = { ...mockLinkSource, preview: mockLinkPreview };
    used = false;
  }
}
function list(workspaceId: string) {
  resetIfNeeded();
  let rows = scopes.get(workspaceId);
  if (!rows) {
    rows = structuredClone([...mockLinkedEngagements]);
    scopes.set(workspaceId, rows);
  }
  return rows;
}
const invalid = () =>
  new ApiError(
    "validation",
    "This code can't be used. Ask the vendor for a new code.",
    { status: 422, code: "ClientLink.Invalid" },
  );
export const mockLinkState = {
  preview(workspaceId: string, code: string) {
    resetIfNeeded();
    if (
      code.trim().toUpperCase() !== mockLinkCode ||
      used ||
      (issued && Date.parse(issued.expiresAt) <= Date.now())
    )
      throw invalid();
    if (issued?.workspaceId === workspaceId)
      throw new ApiError(
        "validation",
        "A workspace can't link to its own engagement.",
        { status: 422, code: "ClientLink.OwnWorkspace" },
      );
    return structuredClone(issued?.preview ?? mockLinkPreview);
  },
  inspect(workspaceId: string, code: string) {
    const preview = this.preview(workspaceId, code),
      source = issued;
    const engagementId =
      source?.engagementId ?? "019a3000-0000-7000-8000-000000000002";
    if (list(workspaceId).some((row) => row.engagementId === engagementId))
      throw invalid();
    return { preview, source, engagementId };
  },
  confirm(workspaceId: string, code: string) {
    const { preview, source, engagementId } = this.inspect(workspaceId, code);
    const row: LinkedEngagement = {
      engagementId,
      engagementName: preview.engagementName,
      clientDisplayName: preview.clientDisplayName,
      linkedAt: new Date().toISOString(),
      version: 1,
    };
    const rows = list(workspaceId);
    used = true;
    rows.push(row);
    if (source)
      bindings.set(JSON.stringify([workspaceId, row.engagementId]), source);
    return { row: structuredClone(row), source };
  },
  list(workspaceId: string) {
    return structuredClone(list(workspaceId));
  },
  remove(workspaceId: string, id: string, version: number) {
    const rows = list(workspaceId),
      index = rows.findIndex((row) => row.engagementId === id);
    if (index < 0) throw invalid();
    if (rows[index]?.version !== version)
      throw new ApiError("conflict", "The link changed.", { status: 409 });
    rows.splice(index, 1);
    const key = JSON.stringify([workspaceId, id]),
      source = bindings.get(key);
    bindings.delete(key);
    return source;
  },
  disconnectSource(workspaceId: string, id: string) {
    resetIfNeeded();
    for (const [key, source] of bindings)
      if (source.workspaceId === workspaceId && source.engagementId === id) {
        const match = zKey(key);
        if (match) {
          const rows = list(match[0]);
          const index = rows.findIndex((row) => row.engagementId === match[1]);
          if (index >= 0) rows.splice(index, 1);
        }
        bindings.delete(key);
      }
  },
};
function zKey(value: string): [string, string] | undefined {
  try {
    const decoded: unknown = JSON.parse(value);
    return Array.isArray(decoded) &&
      decoded.length === 2 &&
      typeof decoded[0] === "string" &&
      typeof decoded[1] === "string"
      ? [decoded[0], decoded[1]]
      : undefined;
  } catch {
    return undefined;
  }
}
