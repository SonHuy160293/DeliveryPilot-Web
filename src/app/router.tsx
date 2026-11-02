import { BrowserRouter, Route, Routes } from "react-router";
import {
  AnonymousOnly,
  RequireAuth,
} from "@/features/auth/components/AuthRoutes";
import { InvitationFlowBoundary } from "@/features/workspaces/recipient/InvitationFlowBoundary";
import { useInvitationFlow } from "@/features/workspaces/recipient/invitationContext";
import type { InvitationFlow } from "@/features/workspaces/recipient/invitationFlow";
import { AppLayout } from "@/layouts/AppLayout";
import { PublicLayout } from "@/layouts/PublicLayout";
import { ROUTES } from "@/lib/routes";
import { AuthPage } from "@/pages/AuthPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { WorkspacesPage } from "@/pages/WorkspacesPage";
import { WorkspaceOverviewPage } from "@/pages/WorkspaceOverviewPage";
import { WorkspaceSwitcher } from "@/features/workspaces/components/WorkspaceSwitcher";
import { JoinWorkspacePage } from "@/pages/JoinWorkspacePage";

export function AppRouter({
  initialInvitation,
}: {
  initialInvitation?: InvitationFlow;
}) {
  return (
    <BrowserRouter>
      <AppRoutes initialInvitation={initialInvitation} />
    </BrowserRouter>
  );
}
export function AppRoutes({
  initialInvitation,
}: {
  initialInvitation?: InvitationFlow;
}) {
  return (
    <InvitationFlowBoundary initial={initialInvitation}>
      <RouteTree />
    </InvitationFlowBoundary>
  );
}
function RouteTree() {
  const flow = useInvitationFlow();
  const continuation = () => (flow.get() ? ROUTES.joinWorkspace : undefined);
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
        <Route path={ROUTES.notFound} element={<NotFoundPage />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout workspaceControl={<WorkspaceSwitcher />} />}>
          <Route path={ROUTES.workspaces} element={<WorkspacesPage />} />
          <Route
            path={ROUTES.workspaceOverview}
            element={<WorkspaceOverviewPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}
