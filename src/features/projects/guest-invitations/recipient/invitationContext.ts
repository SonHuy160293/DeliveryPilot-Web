import { createContext, useContext } from "react";
import type { ProjectInvitationFlow } from "@/features/projects/guest-invitations/recipient/invitationFlow";
export const ProjectInvitationContext =
  createContext<ProjectInvitationFlow | null>(null);
export function useProjectInvitationFlow() {
  const flow = useContext(ProjectInvitationContext);
  if (!flow) throw new Error("Project invitation flow boundary is missing.");
  return flow;
}
