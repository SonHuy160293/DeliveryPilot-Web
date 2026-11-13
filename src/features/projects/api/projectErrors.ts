import { ApiError } from "@/lib/api/apiError";
import type { ActivationRejected } from "@/features/projects/api/types";
export class ProjectActivationError
  extends ApiError
  implements ActivationRejected
{
  constructor(readonly gaps: ActivationRejected["gaps"]) {
    super(
      "validation",
      "Complete every required setup step before activating.",
      { status: 422, code: "Project.ActivationRejected" },
    );
  }
}
export function projectConflict(
  message = "Someone else changed this. Reload to see the latest version.",
): never {
  throw new ApiError("conflict", message, { status: 409 });
}
export function projectNotFound(): never {
  throw new ApiError(
    "not-found",
    "This project isn't available. It may not exist, or you may not have access.",
    { status: 404 },
  );
}
export function projectForbidden(): never {
  throw new ApiError("forbidden", "You do not have access to this operation.", {
    status: 403,
  });
}
