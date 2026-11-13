import { lazy, Suspense, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { MockDataBanner } from "@/components/MockDataBanner";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { authSession } from "@/lib/api/authSession";
import { ProjectInvitationSignedOut } from "@/features/projects/guest-invitations/recipient/ProjectInvitationSignedOut";
import { ProjectInvitationLoading } from "@/features/projects/guest-invitations/recipient/ProjectInvitationLoading";
import { useProjectInvitationFlow } from "@/features/projects/guest-invitations/recipient/invitationContext";
import { ProjectInvitationNotice } from "@/features/projects/guest-invitations/recipient/ProjectInvitationNotice";
import { projectInvitationRepositoryKind } from "@/features/projects/guest-invitations/recipient/queries";
const JoinProjectInvitation = lazy(
  () =>
    import("@/features/projects/guest-invitations/recipient/JoinProjectInvitation"),
);

export function JoinProjectPage() {
  const flow = useProjectInvitationFlow();
  const session = useAuthSession(),
    generation = authSession.version();
  const accountId =
    session.status === "authenticated" ? session.userId : undefined;
  const owner = useMemo(
    () => (accountId ? { accountId, generation } : undefined),
    [accountId, generation],
  );
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
      <PageHeader
        title="Join a project"
        breadcrumbs={[{ label: "Join a project" }]}
      />
      <Card>
        <CardContent>
          {owner ? (
            <Suspense fallback={<ProjectInvitationLoading />}>
              <JoinProjectInvitation
                key={`${owner.accountId}:${String(owner.generation)}`}
                owner={owner}
              />
            </Suspense>
          ) : flow.get() ? (
            <ProjectInvitationSignedOut />
          ) : (
            <ProjectInvitationNotice
              kind="unavailable"
              onSignOut={() => undefined}
            />
          )}
        </CardContent>
      </Card>
      {projectInvitationRepositoryKind() === "mock" ? <MockDataBanner /> : null}
    </div>
  );
}
