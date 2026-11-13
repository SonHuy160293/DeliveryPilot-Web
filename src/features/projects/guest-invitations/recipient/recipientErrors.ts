import { ApiError } from "@/lib/api/apiError";
export type ProjectInvitationProblem = "unavailable" | "mismatch" | "member";
export class ProjectInvitationError extends ApiError {
  constructor(readonly problem: ProjectInvitationProblem) {
    super("forbidden", "Project invitation unavailable", { status: 403 });
  }
}
