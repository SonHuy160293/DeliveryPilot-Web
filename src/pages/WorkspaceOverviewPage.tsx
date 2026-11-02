import { WorkspaceLanding } from "@/features/workspaces/WorkspaceLanding";
import { useAuthSession } from "@/features/auth/model/useAuthSession";
import { authSession } from "@/lib/api/authSession";

/** Route coordination keeps auth and workspace features independent. */
export function WorkspaceOverviewPage() {
  const session = useAuthSession();
  return session.status === "authenticated" ? (
    <WorkspaceLanding
      owner={{ accountId: session.userId, generation: authSession.version() }}
    />
  ) : null;
}
