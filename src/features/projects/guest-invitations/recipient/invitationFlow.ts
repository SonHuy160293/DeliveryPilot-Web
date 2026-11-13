import { isUuid, ROUTES } from "@/lib/routes";
import { createProjectRecipientLifecycle } from "@/features/projects/guest-invitations/recipient/flowLifecycle";
export interface ProjectInvitationSecret {
  invitationId: string;
  proof: string;
}
export function parseProjectInvitationFragment(
  hash: string,
): ProjectInvitationSecret | undefined {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (
    params.getAll("invitationId").length !== 1 ||
    params.getAll("proof").length !== 1
  )
    return undefined;
  const id = params.get("invitationId"),
    proof = params.get("proof");
  return id &&
    isUuid(id) &&
    id !== "00000000-0000-0000-0000-000000000000" &&
    proof?.trim()
    ? { invitationId: id, proof }
    : undefined;
}
/** Called before createRoot/BrowserRouter. Never retain or log the incoming URL. */
export function captureProjectInvitationFragment():
  ProjectInvitationSecret | undefined {
  if (window.location.pathname !== ROUTES.joinProject) return undefined;
  const secret = parseProjectInvitationFragment(window.location.hash);
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search,
  );
  return secret;
}
export const createProjectInvitationFlow = (
  initial?: ProjectInvitationSecret,
) => createProjectRecipientLifecycle(initial);
export type ProjectInvitationFlow = ReturnType<
  typeof createProjectInvitationFlow
>;
