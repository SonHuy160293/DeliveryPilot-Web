import { ApiError } from "@/lib/api/apiError";

const conflicts: Readonly<Record<string, string>> = {
  "Organization.CreationAttemptConflict":
    "This creation attempt has different details. Review your workspaces before starting another attempt.",
  "Organization.CreationAttemptExpired":
    "This creation attempt has expired. Check your workspaces before deliberately starting a new attempt.",
  "Organization.OwnerContinuityRequired":
    "Another eligible Owner must remain. Ask an additional Owner to accept before stepping down.",
  "Organization.RoleInUse":
    "This role is still assigned or referenced by a pending offer. Review permitted assignments and invitations. An expired pending offer may need backend assistance.",
  "Organization.RoleImmutable": "Built-in or retired roles cannot be changed.",
  "Organization.RoleNameReserved":
    "Choose a name other than a reserved built-in role name.",
  "Organization.RoleConflict":
    "This role name is already in use. Review the current catalog.",
  "Invitation.OfferChanged":
    "The offer changed. Refresh and review it; a fresh offer may be required.",
  "Invitation.Closed":
    "This offer is closed or past its deadline. Refresh its current state.",
  "Invitation.RecipientUnavailable":
    "An offer cannot be issued or accepted for this recipient. Ask a workspace manager to review eligibility.",
  "Invitation.PendingOfferExists":
    "A pending offer already exists. Review it before using resend or reissue.",
  "OwnershipNomination.SponsorUnavailable":
    "The sponsoring Owner is no longer eligible. Ask a current Owner to review the nomination.",
  "OwnershipNomination.AlreadyOwner":
    "The nominee is already an Owner. Refresh the current membership.",
  "OwnershipNomination.PendingExists":
    "A pending nomination already exists. Refresh nominations.",
  "OwnershipNomination.Closed":
    "This nomination is closed or past its deadline. Refresh nominations.",
};
export function errorMessage(error: unknown, write = false): string {
  if (!(error instanceof ApiError))
    return "The request could not be completed. Review the current state before trying again.";
  if (error.kind === "cancelled") return "";
  if (error.kind === "forbidden")
    return "Access to this operation is unavailable. Your other workspace access has not been changed.";
  if (error.kind === "unauthenticated") return "Sign in again to continue.";
  if (error.kind === "configuration")
    return "API access is not configured. Contact your administrator.";
  if (error.kind === "rate-limit")
    return "Too many requests. Wait for the displayed delay, then try deliberately.";
  if (error.details.status === 413)
    return "The request is too large. Reduce the submitted content.";
  if (error.kind === "conflict")
    return (
      conflicts[error.details.code ?? ""] ??
      "The current state changed. Refresh and review it before submitting again."
    );
  if (
    write &&
    ["timeout", "network", "protocol", "server"].includes(error.kind)
  )
    return "The outcome is unknown. The operation may have completed. Check the current server state before repeating it.";
  if (["bad-request", "validation"].includes(error.kind))
    return "Check the entered values. The server rejected the request.";
  if (error.kind === "not-found")
    return "This item is no longer available. Refresh the list.";
  return "The request could not be completed. Try refreshing; contact support if it continues.";
}
