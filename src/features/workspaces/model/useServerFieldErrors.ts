import { useEffect } from "react";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/apiError";

export function useServerFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly FieldPath<T>[],
) {
  const identity = fields.join("|");
  useEffect(() => {
    if (!(error instanceof ApiError) || !error.details.fieldErrors) return;
    let first = true;
    for (const field of fields) {
      if (
        !Object.keys(error.details.fieldErrors).some(
          (key) => key.toLowerCase() === field.toLowerCase(),
        )
      )
        continue;
      setError(
        field,
        {
          type: "server",
          message:
            "The server rejected this value. Review it before submitting again.",
        },
        { shouldFocus: first },
      );
      first = false;
    }
  }, [error, setError, identity, fields]);
}
