import { uuid } from "@/features/workspaces/api/contracts";
import { proofInput } from "@/features/workspaces/api/inputs";
import { isOwner, type SessionOwner } from "@/features/workspaces/api/request";
import { ROUTES } from "@/lib/routes";
import { authSession } from "@/lib/api/authSession";

export interface InvitationSecret {
  invitationId: string;
  proof: string;
}
export function parseInvitationFragment(
  hash: string,
): InvitationSecret | undefined {
  if (hash.length > 256) return undefined;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  if (
    params.getAll("invitationId").length !== 1 ||
    params.getAll("proof").length !== 1
  )
    return undefined;
  const id = uuid.safeParse(params.get("invitationId"));
  const secret = proofInput.safeParse({ proof: params.get("proof") });
  return id.success && secret.success
    ? { invitationId: id.data, proof: secret.data.proof }
    : undefined;
}
/** Called once before BrowserRouter is constructed. Never retain/log the incoming URL. */
export function captureInvitationFragment(): InvitationSecret | undefined {
  if (window.location.pathname !== ROUTES.joinWorkspace) return undefined;
  const secret = parseInvitationFragment(window.location.hash);
  window.history.replaceState(
    window.history.state,
    "",
    window.location.pathname + window.location.search,
  );
  return secret;
}
export function createInvitationFlow(initial?: InvitationSecret) {
  let secret = initial;
  initial = undefined;
  const current = authSession.getSnapshot();
  let owner: SessionOwner | undefined =
    secret && current.status === "authenticated"
      ? { accountId: current.userId, generation: authSession.version() }
      : undefined;
  return {
    get: () => {
      if (owner && !isOwner(owner)) secret = undefined;
      return secret;
    },
    bind: (next: SessionOwner) => {
      if (
        owner &&
        (owner.accountId !== next.accountId ||
          owner.generation !== next.generation)
      )
        secret = undefined;
      owner = next;
      return secret;
    },
    retire: () => {
      const current = authSession.getSnapshot();
      if (secret && !owner && current.status === "authenticated")
        owner = {
          accountId: current.userId,
          generation: authSession.version(),
        };
      if (owner && !isOwner(owner)) secret = undefined;
    },
    clear: () => {
      secret = undefined;
      owner = undefined;
    },
  };
}
export type InvitationFlow = ReturnType<typeof createInvitationFlow>;
