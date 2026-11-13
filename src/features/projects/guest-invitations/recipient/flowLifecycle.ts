import { authSession } from "@/lib/api/authSession";
import {
  isRecipientOwner,
  type ProjectRecipientOwner,
} from "@/features/projects/guest-invitations/recipient/owner";
/** The payload lives only in this closure; React receives the flow's methods. */
export function createProjectRecipientLifecycle<T>(initial?: T) {
  let secret = initial;
  initial = undefined;
  const current = authSession.getSnapshot();
  let owner: ProjectRecipientOwner | undefined =
    secret && current.status === "authenticated"
      ? { accountId: current.userId, generation: authSession.version() }
      : undefined;
  return {
    get: () => {
      if (owner && !isRecipientOwner(owner)) secret = undefined;
      return secret;
    },
    bind: (next: ProjectRecipientOwner) => {
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
      if (owner && !isRecipientOwner(owner)) secret = undefined;
    },
    clear: () => {
      secret = undefined;
      owner = undefined;
    },
  };
}
