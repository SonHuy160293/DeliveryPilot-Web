import { useEffect, useRef, useState } from "react";
import { useLocation, useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { ReadState } from "@/components/ReadState";
import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/StatusMessage";
import { MockDataBanner } from "@/components/MockDataBanner";
import { ApiError } from "@/lib/api/apiError";
import { authSession } from "@/lib/api/authSession";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { ROUTES, isUuid } from "@/lib/routes";
import { projectJoinMessage } from "@/features/projects/model/projectJoinMessage";
import {
  guestProjectViewQuery,
  portalRepositoryKind,
} from "@/features/portal/api/queries";
import { PortalProjectView } from "@/features/portal/components/PortalProjectView";
import { GuestBriefSection } from "@/features/portal/components/GuestBriefSection";
import { GuestStakeholders } from "@/features/portal/components/GuestStakeholders";
import { LeaveGuestProject } from "@/features/portal/components/LeaveGuestProject";
export function PortalProjectPage() {
  const location = useLocation(),
    { projectId = "" } = useParams(),
    session = useAuthSession(),
    container = useRef<HTMLDivElement>(null);
  const scope = {
    accountId: session.status === "authenticated" ? session.userId : "",
    generation: authSession.version(),
  };
  const options = guestProjectViewQuery(scope, projectId),
    query = useQuery({
      ...options,
      enabled: !!scope.accountId && isUuid(projectId),
    });
  const [message, setMessage] = useState(() =>
    projectJoinMessage(location.state, projectId),
  );
  const mock = portalRepositoryKind() === "mock",
    unavailable =
      query.error instanceof ApiError &&
      ["not-found", "forbidden"].includes(query.error.kind);
  useEffect(() => {
    if (message && query.data) {
      const heading = container.current?.querySelector("h1");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
  }, [message, query.data]);
  return (
    <div ref={container} className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title={!unavailable ? (query.data?.name ?? "Project") : "Project"}
        breadcrumbs={[
          { label: "Client portal", to: ROUTES.portal },
          { label: !unavailable ? (query.data?.name ?? "Project") : "Project" },
        ]}
      />
      <StatusMessage
        message={query.data && !unavailable ? message : null}
        mock={mock}
        onDismiss={() => {
          setMessage(null);
        }}
      />
      {unavailable ? (
        <div>
          <p>This project isn't available. Your access may have ended.</p>
          <Button variant="outline" asChild>
            <Link to={ROUTES.portal}>Back to my projects</Link>
          </Button>
        </div>
      ) : (
        <ReadState
          query={query}
          queryKey={options.queryKey}
          scope="Client project"
        >
          {query.data ? (
            <PortalProjectView
              view={query.data}
              actions={
                <>
                  <GuestBriefSection
                    view={query.data}
                    scope={scope}
                    onSuccess={setMessage}
                  />
                  <GuestStakeholders
                    view={query.data}
                    scope={scope}
                    onSuccess={setMessage}
                  />
                  <LeaveGuestProject
                    scope={scope}
                    projectId={projectId}
                    name={query.data.name}
                  />
                </>
              }
            />
          ) : null}
        </ReadState>
      )}
      {mock ? <MockDataBanner /> : null}
    </div>
  );
}
