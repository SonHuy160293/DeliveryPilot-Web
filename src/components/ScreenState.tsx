import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import type { ReactNode } from "react";

export type PreviewState =
  "ready" | "loading" | "empty" | "error" | "success" | "no-permission";

type NonReadyState = Exclude<PreviewState, "ready">;

interface ScreenStateProps {
  status: NonReadyState;
  scope: string;
  presentation?: { title: string; description: string; action?: ReactNode };
}

export function ScreenState({ status, scope, presentation }: ScreenStateProps) {
  if (status === "loading") {
    return (
      <div role="status" aria-busy="true" className="space-y-4 py-8">
        <span className="sr-only">Loading {scope.toLowerCase()}.</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (status === "empty") {
    return (
      <EmptyState
        title="Nothing to show yet"
        description={`No ${scope.toLowerCase()} content is available in this preview. Remove the state query to view the regular page.`}
      />
    );
  }

  const messages = {
    error: {
      title: `Could not display ${scope.toLowerCase()}`,
      description:
        "This is an error-state preview. No request was sent. Remove the state query to return to the page.",
    },
    success: {
      title: "Preview state completed",
      description: "The success-state preview rendered. No change was saved.",
    },
    "no-permission": {
      title: "Access unavailable",
      description:
        "This is a permission-state preview. Real access checks are not connected.",
    },
  } as const;
  const message = presentation ?? messages[status];

  return (
    <div className="py-8">
      <Alert
        variant={status === "error" ? "destructive" : "default"}
        role={status === "success" ? "status" : "alert"}
      >
        <AlertTitle>{message.title}</AlertTitle>
        <AlertDescription>{message.description}</AlertDescription>
        {presentation?.action}
      </Alert>
    </div>
  );
}
