import { BrowserRouter, Route, Routes } from "react-router";
import { lazy, Suspense } from "react";
import { ScreenState } from "@/components/ScreenState";
import { AuthenticatedLayout } from "@/app/AuthenticatedLayout";
import { ValidatedRouteIds } from "@/app/ValidatedRouteIds";
import {
  AnonymousOnly,
  RequireAuth,
} from "@/features/auth/components/AuthRoutes";
import { InvitationFlowBoundary } from "@/features/workspaces/recipient/InvitationFlowBoundary";
import { useInvitationFlow } from "@/features/workspaces/recipient/invitationContext";
import type { InvitationFlow } from "@/features/workspaces/recipient/invitationFlow";
import { PortalLayout } from "@/layouts/PortalLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { ROUTES } from "@/lib/routes";
import { AuthPage } from "@/pages/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { WorkspacesPage } from "@/pages/WorkspacesPage";
import { WorkspaceOverviewPage } from "@/pages/WorkspaceOverviewPage";
import { JoinWorkspacePage } from "@/pages/JoinWorkspacePage";
import { EngagementsPage } from "@/pages/EngagementsPage";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { JoinProjectPage } from "@/pages/JoinProjectPage";
import { PortalHomePage } from "@/pages/PortalHomePage";
import { PortalProjectPage } from "@/pages/PortalProjectPage";
import { ProjectInvitationFlowBoundary } from "@/features/projects/guest-invitations/recipient/ProjectInvitationFlowBoundary";
import { useProjectInvitationFlow } from "@/features/projects/guest-invitations/recipient/invitationContext";
import type { ProjectInvitationFlow } from "@/features/projects/guest-invitations/recipient/invitationFlow";

const EngagementDetailPage = lazy(() =>
  import("@/pages/EngagementDetailPage").then((module) => ({
    default: module.EngagementDetailPage,
  })),
);

export function AppRouter({
  initialInvitation,
  initialProjectInvitation,
}: {
  initialInvitation?: InvitationFlow;
  initialProjectInvitation?: ProjectInvitationFlow;
}) {
  return (
    <BrowserRouter>
      <AppRoutes
        initialInvitation={initialInvitation}
        initialProjectInvitation={initialProjectInvitation}
      />
    </BrowserRouter>
  );
}
export function AppRoutes({
  initialInvitation,
  initialProjectInvitation,
}: {
  initialInvitation?: InvitationFlow;
  initialProjectInvitation?: ProjectInvitationFlow;
}) {
  return (
    <InvitationFlowBoundary initial={initialInvitation}>
      <ProjectInvitationFlowBoundary initial={initialProjectInvitation}>
        <RouteTree />
      </ProjectInvitationFlowBoundary>
    </InvitationFlowBoundary>
  );
}
function RouteTree() {
  const flow = useInvitationFlow();
  const projectFlow = useProjectInvitationFlow();
  const continuation = () =>
    projectFlow.get()
      ? ROUTES.joinProject
      : flow.get()
        ? ROUTES.joinWorkspace
        : undefined;
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route
          path={ROUTES.signIn}
          element={
            <AnonymousOnly resolveRedirect={continuation}>
              <AuthPage
                key="signIn"
                mode="signIn"
                resolveContinuation={continuation}
              />
            </AnonymousOnly>
          }
        />
        <Route
          path={ROUTES.signUp}
          element={
            <AnonymousOnly>
              <AuthPage key="signUp" mode="signUp" />
            </AnonymousOnly>
          }
        />
        <Route path={ROUTES.joinWorkspace} element={<JoinWorkspacePage />} />
        <Route path={ROUTES.joinProject} element={<JoinProjectPage />} />
        <Route path={ROUTES.notFound} element={<NotFoundPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<ValidatedRouteIds />}>
          <Route element={<AuthenticatedLayout />}>
            <Route path={ROUTES.workspaces} element={<WorkspacesPage />} />
            <Route
              path={ROUTES.workspaceOverview}
              element={<WorkspaceOverviewPage />}
            />
            <Route
              path={ROUTES.workspaceEngagements}
              element={<EngagementsPage />}
            />
            <Route
              path={ROUTES.workspaceEngagement}
              element={
                <Suspense
                  fallback={<ScreenState status="loading" scope="engagement" />}
                >
                  <EngagementDetailPage />
                </Suspense>
              }
            />
            <Route path={ROUTES.workspaceProjects} element={<ProjectsPage />} />
            <Route
              path={ROUTES.workspaceProject}
              element={<ProjectDetailPage />}
            />
          </Route>
          <Route element={<PortalLayout />}>
            <Route path={ROUTES.portal} element={<PortalHomePage />} />
            <Route
              path={ROUTES.portalProject}
              element={<PortalProjectPage />}
            />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
