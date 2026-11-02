import type { ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";

import { errorMessage } from "@/features/workspaces/model/errorMessages";

export function ApiFeedback({
  error,
  write = false,
  kind = "success",
  children,
}: {
  error?: unknown;
  write?: boolean;
  kind?: "success" | "info";
  children?: ReactNode;
}) {
  const message = error ? errorMessage(error, write) : undefined;
  if (error && !message) return null;
  if (!message && !children) return null;
  return (
    <Alert
      variant={message ? "destructive" : "default"}
      role={message ? "alert" : kind === "info" ? "note" : "status"}
    >
      <AlertDescription className="flex flex-col gap-2 break-words">
        {message ?? children}
        {error instanceof ApiError && error.details.traceId ? (
          <span>Support reference: {error.details.traceId}</span>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
export function RefreshButton({
  refresh,
  pending = false,
}: {
  refresh: () => unknown;
  pending?: boolean;
}) {
  return (
    <Button
      variant="outline"
      type="button"
      disabled={pending}
      onClick={() => {
        void refresh();
      }}
    >
      Refresh
    </Button>
  );
}
