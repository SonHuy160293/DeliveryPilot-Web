import { useAuthSession } from "@/features/auth/model/useAuthSession";
import { WorkspacePortfolio } from "@/features/workspaces/components/WorkspacePortfolio";
import { authSession } from "@/lib/api/authSession";

export function WorkspacesPage() {
  const session = useAuthSession();
  return session.status === "authenticated" ? (
    <WorkspacePortfolio
      key={`${session.userId}:${String(authSession.version())}`}
      owner={{ accountId: session.userId, generation: authSession.version() }}
    />
  ) : null;
}
