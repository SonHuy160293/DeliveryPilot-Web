import type { ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ScreenState, type PreviewState } from "@/components/ScreenState";

/** Demo-only state override. MUST be removed when real, authorized data is wired. */
export function usePagePreviewState(): PreviewState {
  const [params] = useSearchParams();
  switch (params.get("state")) {
    case "loading":
      return "loading";
    case "empty":
      return "empty";
    case "error":
      return "error";
    case "success":
      return "success";
    case "no-permission":
      return "no-permission";
    default:
      return "ready";
  }
}

interface PageStateGateProps {
  state: PreviewState;
  scope: string;
  empty?: ReactNode;
  children: ReactNode;
  presentation?: { title: string; description: string; action?: ReactNode };
}

export function PageStateGate({
  state,
  scope,
  empty,
  children,
  presentation,
}: PageStateGateProps) {
  if (state === "ready") return <>{children}</>;
  if (state === "empty" && empty) return <>{empty}</>;
  return (
    <ScreenState status={state} scope={scope} presentation={presentation} />
  );
}
