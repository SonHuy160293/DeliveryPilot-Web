import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
export interface ProjectRecipientOwner {
  accountId: string;
  generation: number;
}
export function isRecipientOwner(owner: ProjectRecipientOwner) {
  const current = authSession.getSnapshot();
  return (
    current.status === "authenticated" &&
    current.userId === owner.accountId &&
    authSession.version() === owner.generation
  );
}
export function assertRecipientOwner(owner: ProjectRecipientOwner) {
  if (!isRecipientOwner(owner))
    throw new ApiError("cancelled", "The session changed.");
}
