import { Outlet, useParams } from "react-router";
import { isUuid } from "@/lib/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";

/** Validate resource IDs before mounting the shell, which reads workspace discovery. */
export function ValidatedRouteIds() {
  const { engagementId, projectId } = useParams<{
    engagementId: string;
    projectId: string;
  }>();
  if (
    (engagementId !== undefined && !isUuid(engagementId)) ||
    (projectId !== undefined && !isUuid(projectId))
  ) {
    return (
      <main id="main-content" tabIndex={-1}>
        <NotFoundPage />
      </main>
    );
  }
  return <Outlet />;
}
