import type { ComponentType } from "react";
import type { ScopedOwner } from "@/features/workspaces/api/queries";
export type WorkspaceExtraPanel = ComponentType<{
  scope: ScopedOwner;
  workspaceName: string;
}>;
export interface WorkspaceExtraPanels {
  clientLinks?: WorkspaceExtraPanel;
  projectRecovery?: WorkspaceExtraPanel;
}
