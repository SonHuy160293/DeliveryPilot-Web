import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sharingWriteMutation,
  sharingProjectKey,
  isCurrentSharingScope,
  type SharingScope,
  type SharingWrite,
} from "@/features/sharing/api/queries";
import { ApiError } from "@/lib/api/apiError";
export function useSharingActions(
  scope: SharingScope,
  id: string,
  onSuccess: (message: string) => void,
  onUnavailable: (error: unknown) => void,
) {
  const client = useQueryClient(),
    mutation = useMutation(sharingWriteMutation(scope, id));
  const live = useRef(false),
    running = useRef(false),
    [notice, setNotice] = useState<string>(),
    [pending, setPending] = useState(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const current = () => live.current && isCurrentSharingScope(scope);
  async function run(input: SharingWrite, message: string): Promise<boolean> {
    if (!current() || running.current) return false;
    running.current = true;
    setPending(true);
    setNotice(undefined);
    try {
      await mutation.mutateAsync(input);
      if (!current()) return false;
      await client.invalidateQueries({
        queryKey: sharingProjectKey(scope, id),
      });
      if (!current()) return false;
      onSuccess(message);
      return true;
    } catch (error) {
      if (!current()) return false;
      if (error instanceof ApiError && error.kind === "conflict") {
        await client.invalidateQueries({
          queryKey: sharingProjectKey(scope, id),
        });
        if (current())
          setNotice(
            "Sharing changed while you were working. Showing the latest state.",
          );
        return true;
      }
      if (error instanceof ApiError && error.kind === "not-found")
        onUnavailable(error);
      if (error instanceof ApiError && error.kind === "forbidden")
        await client.invalidateQueries({
          queryKey: sharingProjectKey(scope, id),
        });
      throw error;
    } finally {
      running.current = false;
      if (current()) setPending(false);
    }
  }
  return { run, notice, pending, reset: mutation.reset };
}
export type SharingActions = ReturnType<typeof useSharingActions>;
