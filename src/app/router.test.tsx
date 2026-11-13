import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { authSession } from "@/lib/api/authSession";
import {
  ROUTES,
  workspaceEngagementsPath,
  workspaceEngagementPath,
  workspaceProjectsPath,
  workspaceProjectPath,
  portalProjectPath,
} from "@/lib/routes";
import { httpClient } from "@/lib/api/httpClient";
import { renderRoute } from "@/test/renderRoute";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";
import {
  establishOrganizationSession,
  organizationReadHandlers,
} from "@/test/fixtures/organizationApi";
import { organizationIds } from "@/mocks/workspaces";
import { server } from "@/test/mocks/server";

const pages = [
  [ROUTES.home, /Know what’s committed/],
  [ROUTES.signIn, /^Sign in$/],
  [ROUTES.signUp, /Create an account/],
  ["/unknown-address", /Page not found/],
] as const;
const workspaceId = "00000000-0000-0000-0000-000000000001";
const resourceId = "abcdef01-2345-6789-abcd-ef0123456789";
const protectedPages = [
  [workspaceEngagementsPath(workspaceId), "Engagements"],
  [workspaceEngagementPath(workspaceId, resourceId), "Engagement"],
  [workspaceProjectsPath(workspaceId), "Projects"],
  [workspaceProjectPath(workspaceId, resourceId), "Project"],
  [ROUTES.portal, "My projects"],
  [portalProjectPath(resourceId), "Project"],
] as const;
function signIn() {
  authSession.establish(
    {
      userId: workspaceId,
      accessToken: "test.header.signature",
      expiresAt: Date.now() + 60_000,
    },
    authSession.begin(),
  );
}
describe("approved routes", () => {
  it("renders join project publicly", () => {
    renderRoute(ROUTES.joinProject);
    expect(
      screen.getByRole("heading", { level: 1, name: "Join a project" }),
    ).toBeVisible();
    expect(
      screen.getByRole("navigation", { name: "Public navigation" }),
    ).toBeVisible();
  });
  it.each(
    protectedPages.filter(
      ([path]) =>
        path !== workspaceEngagementsPath(workspaceId) &&
        path !== workspaceProjectsPath(workspaceId) &&
        path !== workspaceProjectPath(workspaceId, resourceId) &&
        path !== workspaceEngagementPath(workspaceId, resourceId),
    ),
  )("renders the approved portal route %s", async (path, title) => {
    signIn();
    renderRoute(path);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    expect(
      screen.getAllByRole("navigation", { name: "breadcrumb" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main-content");
  });
  it("renders the connected engagements route after workspace admission", async () => {
    establishOrganizationSession();
    server.use(...organizationReadHandlers);
    renderOrganizationRoute(
      workspaceEngagementsPath(organizationIds.organization),
    );
    expect(
      await screen.findByRole("heading", { level: 1, name: "Engagements" }),
    ).toBeVisible();
    expect(
      screen.getByText(/Sample data. This page is not connected/),
    ).toBeVisible();
  });
  it.each(protectedPages)("guards anonymous access to %s", (path) => {
    renderRoute(path);
    expect(
      screen.getByRole("heading", { level: 1, name: "Sign in" }),
    ).toBeVisible();
  });
  it.each([
    workspaceEngagementPath(workspaceId, "invalid"),
    workspaceProjectPath(workspaceId, "invalid"),
    portalProjectPath("invalid"),
  ])("rejects malformed IDs before any request: %s", async (path) => {
    signIn();
    const request = vi.spyOn(httpClient, "request");
    renderRoute(path);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeVisible();
    expect(request).not.toHaveBeenCalled();
    request.mockRestore();
  });
  it.each(pages)(
    "renders %s with a main landmark and page heading",
    (path, heading) => {
      renderRoute(path);
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: heading }),
      ).toBeVisible();
      expect(
        screen.getByRole("link", { name: "Skip to content" }),
      ).toHaveAttribute("href", "#main-content");
    },
  );
  it("navigates between auth variants and clears credentials", async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.signIn);
    await user.type(screen.getByLabelText("Email"), "preview@example.com");
    await user.type(screen.getByLabelText("Password"), "sample");
    await user.click(screen.getByRole("link", { name: "Register" }));
    expect(
      screen.getByRole("heading", { name: "Create an account" }),
    ).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveValue("");
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });
  it.each([ROUTES.workspaces, "/w/unverified-slug"])(
    "redirects anonymous access to %s to sign in",
    (path) => {
      renderRoute(path);
      expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
      expect(screen.queryByText("Northstar delivery")).not.toBeInTheDocument();
    },
  );
  it("shows no invented memberships when signed in", async () => {
    authSession.establish(
      {
        userId: "00000000-0000-0000-0000-000000000001",
        accessToken: "test.header.signature",
        expiresAt: Date.now() + 60_000,
      },
      authSession.begin(),
    );
    renderRoute(ROUTES.workspaces);
    expect(screen.getByRole("heading", { name: "Workspaces" })).toBeVisible();
    expect(await screen.findByText(/No workspaces yet/)).toBeVisible();
    expect(screen.queryByText("Northstar delivery")).not.toBeInTheDocument();
  });
});
describe.each([pages[0], pages[3]])("screen previews on %s", (path) => {
  it.each(["loading", "empty", "error", "success", "no-permission"] as const)(
    "renders %s",
    (state) => {
      renderRoute(`${path}?state=${state}`);
      if (state === "loading")
        expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
      if (state === "empty")
        expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
          "Nothing to show yet",
        );
      if (state === "error")
        expect(screen.getByRole("alert")).toHaveTextContent(
          "No request was sent",
        );
      if (state === "success")
        expect(screen.getByRole("status")).toHaveTextContent(
          "No change was saved",
        );
      if (state === "no-permission")
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Access unavailable",
        );
    },
  );
});
