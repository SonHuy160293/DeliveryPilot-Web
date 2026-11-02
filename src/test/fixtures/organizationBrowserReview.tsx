/** Test-only browser entry. Never imported by main.tsx or a production route. */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "@/app/router";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authSession } from "@/lib/api/authSession";
import { ROUTES, workspaceOverviewPath } from "@/lib/routes";
import { organizationIds as ids } from "@/mocks/workspaces";
import { createInvitationFlow } from "@/features/workspaces/recipient/invitationFlow";
import "@/index.css";

authSession.establish(
  {
    userId: ids.user,
    accessToken: "review.header.signature",
    expiresAt: Date.now() + 3_600_000,
  },
  authSession.begin(),
);
const mode = new URLSearchParams(window.location.search).get("screen");
const route =
  mode === "workspace"
    ? workspaceOverviewPath(ids.organization)
    : mode === "join"
      ? ROUTES.joinWorkspace
      : ROUTES.workspaces;
const invitation =
  mode === "join"
    ? createInvitationFlow({
        invitationId: ids.invitation,
        proof: "b".repeat(43),
      })
    : undefined;
const root = document.getElementById("root");
if (!root) throw new Error("Review root is missing.");
createRoot(root).render(
  <StrictMode>
    <QueryProvider>
      <Alert role="status">
        <AlertDescription>
          Synthetic browser review. All records and operations are fictional;
          nothing is sent to a real workspace.
        </AlertDescription>
      </Alert>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes initialInvitation={invitation} />
      </MemoryRouter>
    </QueryProvider>
  </StrictMode>,
);
