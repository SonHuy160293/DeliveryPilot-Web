import { WorkspaceLanding } from "@/features/workspaces/WorkspaceLanding";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { authSession } from "@/lib/api/authSession";
import { lazy, Suspense } from "react";
import { ScreenState } from "@/components/ScreenState";
import type { WorkspaceExtraPanel } from "@/features/workspaces/components/workspaceExtraPanels";
const ClientLinks = lazy(
  () => import("@/features/engagements/link/ClientLinksPanel"),
);
const Recovery = lazy(
  () => import("@/features/projects/recovery/ProjectRecoveryPanel"),
);
const ClientLinksPanel: WorkspaceExtraPanel = (props) => (
  <Suspense fallback={<ScreenState status="loading" scope="Client links" />}>
    <ClientLinks {...props} />
  </Suspense>
);
const RecoveryPanel: WorkspaceExtraPanel = (props) => (
  <Suspense
    fallback={<ScreenState status="loading" scope="Project recovery" />}
  >
    <Recovery {...props} />
  </Suspense>
);

/** Route coordination keeps auth and workspace features independent. */
export function WorkspaceOverviewPage() {
  const session = useAuthSession();
  return session.status === "authenticated" ? (
    <WorkspaceLanding
      owner={{ accountId: session.userId, generation: authSession.version() }}
      extraPanels={{
        clientLinks: ClientLinksPanel,
        projectRecovery: RecoveryPanel,
      }}
    />
  ) : null;
}
