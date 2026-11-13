import type { ComponentType } from "react";
import type { ProjectScope } from "@/features/projects/api/queries";
import type { BriefItemCode } from "@/features/projects/api/types";
export type ProjectShareBadgeComponent = ComponentType<{
  scope: ProjectScope;
  projectId: string;
  canManage: boolean;
  label?: string;
  item: { briefItemCode?: BriefItemCode; stakeholderId?: string };
}>;
