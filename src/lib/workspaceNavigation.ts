/** Presentation hints from current server reads; never authorization grants. */
export interface WorkspaceNavigation {
  workspaceId: string;
  engagements: boolean;
  clientLinks: boolean;
  projectRecovery: boolean;
}
