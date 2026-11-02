import { ApiError } from "@/lib/api/apiError";
import { isRecord, responseDiagnostics } from "@/lib/api/errorNormalizer";

/** Verified against DeliveryPilot.SharedKernel ApiResponse; no global Axios unwrapping. */
export function unwrapApiResponse(value: unknown): unknown {
  if (
    !isRecord(value) ||
    typeof value.success !== "boolean" ||
    !("data" in value) ||
    !("error" in value) ||
    (value.success && value.error !== null) ||
    (!value.success &&
      (value.data !== null ||
        !isRecord(value.error) ||
        typeof value.error.code !== "string" ||
        typeof value.error.message !== "string"))
  ) {
    throw new ApiError(
      "protocol",
      "The server returned an unexpected response.",
    );
  }
  if (!value.success) {
    throw new ApiError(
      "application",
      "The request could not be completed.",
      responseDiagnostics(value),
    );
  }
  return value.data;
}
