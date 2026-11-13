import { lazy, Suspense } from "react";
import { Navigate } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { ScreenState } from "@/components/ScreenState";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { useInvitationFlow } from "@/features/workspaces/recipient/invitationContext";
import { authSession } from "@/lib/api/authSession";
import { ROUTES } from "@/lib/routes";

const JoinInvitation = lazy(
  () => import("@/features/workspaces/recipient/JoinInvitation"),
);
export function JoinWorkspacePage() {
  const session = useAuthSession();
  const flow = useInvitationFlow();
  if (session.status !== "authenticated" && flow.get())
    return (
      <Navigate
        to={ROUTES.signIn}
        replace
        state={{ from: ROUTES.joinWorkspace }}
      />
    );
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <PageHeader
        title="Join a workspace"
        description="Review an invitation for your current account."
      />
      {session.status === "authenticated" ? (
        <Suspense
          fallback={<ScreenState status="loading" scope="Invitation" />}
        >
          <JoinInvitation
            key={`${session.userId}:${String(authSession.version())}`}
            owner={{
              accountId: session.userId,
              generation: authSession.version(),
            }}
          />
        </Suspense>
      ) : (
        <p role="status">
          Reopen the original invitation email to continue. The proof is kept
          only in this tab and is lost after reload.
        </p>
      )}
    </div>
  );
}
