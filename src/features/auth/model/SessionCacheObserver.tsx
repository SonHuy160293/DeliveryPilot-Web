import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authSession } from "@/lib/api/authSession";
import { clearSessionCache } from "@/lib/query/queryScope";

export function SessionCacheObserver() {
  const client = useQueryClient();
  useEffect(
    () =>
      authSession.subscribe(() => {
        if (authSession.getSnapshot().status === "anonymous")
          void clearSessionCache(client);
      }),
    [client],
  );
  return null;
}
