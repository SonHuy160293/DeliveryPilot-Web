import { useMemo } from "react";
import { Link, useMatch, useParams } from "react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { WorkspaceNavigationBoundary } from "@/features/workspaces/components/WorkspaceNavigationBoundary";
import { WorkspaceSwitcher } from "@/features/workspaces/components/WorkspaceSwitcher";
import { AppLayout } from "@/layouts/AppLayout";
import { authSession } from "@/lib/api/authSession";
import { ROUTES, isUuid } from "@/lib/routes";

export function AuthenticatedLayout() {
  const portfolio = useMatch(ROUTES.workspaces);
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const session = useAuthSession();
  const accountId =
    session.status === "authenticated" ? session.userId : undefined;
  const generation = authSession.version();
  const scope = useMemo(
    () =>
      accountId && workspaceSlug && isUuid(workspaceSlug)
        ? { accountId, generation, workspaceId: workspaceSlug }
        : undefined,
    [accountId, generation, workspaceSlug],
  );
  const breadcrumbs = (
    <Breadcrumb>
      <BreadcrumbList>
        {portfolio ? (
          <BreadcrumbItem>
            <BreadcrumbPage>Workspaces</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={ROUTES.workspaces}>Workspaces</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Workspace</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
  const controls = <WorkspaceSwitcher />;
  return scope ? (
    <WorkspaceNavigationBoundary
      key={`${scope.accountId}:${String(scope.generation)}:${scope.workspaceId}`}
      scope={scope}
    >
      {(navigation, content) => (
        <AppLayout
          breadcrumbs={breadcrumbs}
          workspaceControl={controls}
          navigation={navigation}
          content={content}
        />
      )}
    </WorkspaceNavigationBoundary>
  ) : (
    <AppLayout breadcrumbs={breadcrumbs} workspaceControl={controls} />
  );
}
