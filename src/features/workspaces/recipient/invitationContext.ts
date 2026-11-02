import { createContext, useContext } from "react";
import type { InvitationFlow } from "@/features/workspaces/recipient/invitationFlow";

export const InvitationContext = createContext<InvitationFlow | null>(null);
export function useInvitationFlow(): InvitationFlow {
  const flow = useContext(InvitationContext);
  if (!flow) throw new Error("Invitation flow boundary is missing.");
  return flow;
}
