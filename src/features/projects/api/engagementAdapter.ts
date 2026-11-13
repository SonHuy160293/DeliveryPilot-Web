import type {
  EngagementDetail,
  EngagementSummary,
} from "@/features/engagements/api/types";
/** Composition injects this boundary; projects never imports another feature's implementation. */
export interface ProjectEngagementAdapter {
  clientPoMatches(
    workspaceId: string,
    id: string,
    candidates: readonly { id: string; email: string }[],
    signal?: AbortSignal,
  ): Promise<string[]>;
  /** Call only after the project repository's participant admission. */
  getSummary(
    workspaceId: string,
    id: string,
    signal?: AbortSignal,
  ): Promise<{ summary: EngagementSummary; canOpenFullDetail: boolean }>;
  listVisible(
    workspaceId: string,
    signal?: AbortSignal,
  ): Promise<EngagementDetail[]>;
  getVisible(
    workspaceId: string,
    id: string,
    signal?: AbortSignal,
  ): Promise<EngagementDetail>;
}
