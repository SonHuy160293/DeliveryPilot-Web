import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/apiError";

export const isForbidden = (error: unknown): boolean =>
  error instanceof ApiError && error.kind === "forbidden";

/** Keep the active denial to prevent refetch loops; erase protected cached payloads. */
export function useDeniedCleanup(error: unknown, queryKey: readonly unknown[]) {
  const client = useQueryClient();
  const identity = JSON.stringify(queryKey);
  useEffect(() => {
    if (!isForbidden(error)) return;
    const key: unknown = JSON.parse(identity);
    if (!Array.isArray(key)) return;
    const queries = client.getQueryCache().findAll({ queryKey: key });
    void client.cancelQueries({ queryKey: key }, { revert: false }).then(() => {
      for (const query of queries) {
        if (query.getObserversCount() === 0)
          client.getQueryCache().remove(query);
        else if (query.state.data !== undefined)
          query.setState({ data: undefined, error, status: "error" });
      }
    });
  }, [client, error, identity]);
}
