import { ApiError } from "@/lib/api/apiError";
import { Alert, AlertDescription } from "@/components/ui/alert";
const messages = new Set([
  "This person is already on the team.",
  "This person isn't an active member of the workspace.",
  "This person already has a pending invitation.",
  "This person is a workspace member. Add them as a team member instead.",
  "A project needs at least one administrator. Make someone else an administrator first.",
]);
/** Only approved domain copy is displayed; arbitrary repository text remains private. */
export function teamActionFeedback(error: unknown) {
  if (!(error instanceof ApiError)) return undefined;
  const message =
    error.kind === "rate-limit"
      ? "You've sent several invitations recently. Try again in 1 minute."
      : messages.has(error.message)
        ? error.message
        : undefined;
  return message ? (
    <Alert role="alert">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  ) : undefined;
}
