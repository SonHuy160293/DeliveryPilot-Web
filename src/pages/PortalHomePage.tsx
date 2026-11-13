import { useState } from "react";
import { useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { ReadState } from "@/components/ReadState";
import { StatusMessage } from "@/components/StatusMessage";
import { MockDataBanner } from "@/components/MockDataBanner";
import { authSession } from "@/lib/api/authSession";
import { useAuthSession } from "@/lib/api/useAuthSession";
import {
  guestProjectsQuery,
  portalRepositoryKind,
} from "@/features/portal/api/queries";
import { GuestProjectCard } from "@/features/portal/components/GuestProjectCard";
import { Skeleton } from "@/components/ui/skeleton";
export function PortalHomePage() {
  const session = useAuthSession(),
    location = useLocation();
  const scope = {
    accountId: session.status === "authenticated" ? session.userId : "",
    generation: authSession.version(),
  };
  const options = guestProjectsQuery(scope),
    query = useQuery({ ...options, enabled: !!scope.accountId });
  const state: unknown = location.state;
  const left =
    typeof state === "object" &&
    state !== null &&
    "leftProject" in state &&
    typeof state.leftProject === "string" &&
    state.leftProject.length <= 160
      ? `You left ${state.leftProject}.`
      : null;
  const [dismissed, setDismissed] = useState(false),
    mock = portalRepositoryKind() === "mock";
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="My projects"
        description="Projects you were invited to as a client guest."
        breadcrumbs={[{ label: "Client portal" }]}
      />
      <StatusMessage
        message={dismissed ? null : left}
        mock={mock}
        onDismiss={() => {
          setDismissed(true);
        }}
      />
      {query.isPending ? (
        <div
          role="status"
          aria-busy="true"
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          <span className="sr-only">Loading client projects.</span>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <ReadState
          query={query}
          queryKey={options.queryKey}
          scope="Client projects"
          empty={query.data?.length === 0}
          emptyTitle="You haven't been invited to any client projects"
          emptyDescription="When a vendor invites you to a project, it appears here."
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {query.data?.map((row) => (
              <GuestProjectCard key={row.projectId} project={row} />
            ))}
          </div>
        </ReadState>
      )}
      {mock ? <MockDataBanner /> : null}
    </div>
  );
}
