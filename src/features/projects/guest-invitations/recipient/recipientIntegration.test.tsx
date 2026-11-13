import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, Link } from "react-router";
import { http } from "msw";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/router";
import { SessionCacheObserver } from "@/features/auth/model/SessionCacheObserver";
import { createQueryClient } from "@/lib/query/queryClient";
import { ROUTES, portalProjectPath } from "@/lib/routes";
import { ApiError } from "@/lib/api/apiError";
import { authSession } from "@/lib/api/authSession";
import {
  createProjectInvitationFlow,
  captureProjectInvitationFragment,
  parseProjectInvitationFragment,
  type ProjectInvitationFlow,
} from "@/features/projects/guest-invitations/recipient/invitationFlow";
import { getProjectInvitationResponseRepository } from "@/features/projects/guest-invitations/recipient/projectInvitationResponseRepository";
import { ProjectInvitationError } from "@/features/projects/guest-invitations/recipient/recipientErrors";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { projectInvitationPreviewFixture as fixture } from "@/mocks/projects";
import { firstProject } from "@/test/fixtures/projectMock";
import {
  apiBase,
  establishOrganizationSession,
  organizationReadHandlers,
  success,
} from "@/test/fixtures/organizationApi";
import { organizationIds as ids } from "@/mocks/workspaces";
import { server } from "@/test/mocks/server";
const secret = {
  invitationId: fixture.invitationId,
  proof: "project-only-ephemeral-proof",
};
const unavailable =
  "This invitation can no longer be used. Ask the project team to send a new one.";
beforeEach(() => {
  __resetMocks();
  __setMockPersona("u-grace");
  server.use(...organizationReadHandlers);
});
afterEach(() => {
  __resetMocks();
  vi.restoreAllMocks();
});
function Path() {
  const location = useLocation();
  return (
    <>
      <output aria-label="Current location">
        {location.pathname}
        {location.hash}
      </output>
      <Link to={ROUTES.home}>Abandon invitation</Link>
    </>
  );
}
function harness(
  flow: ProjectInvitationFlow = createProjectInvitationFlow(secret),
  strict = true,
) {
  const client = createQueryClient();
  client.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  });
  const tree = (
    <QueryClientProvider client={client}>
      <SessionCacheObserver />
      <MemoryRouter initialEntries={[ROUTES.joinProject]}>
        <Path />
        <AppRoutes initialProjectInvitation={flow} />
      </MemoryRouter>
    </QueryClientProvider>
  );
  const view = render(strict ? <StrictMode>{tree}</StrictMode> : tree);
  return { ...view, client, flow };
}
function noProof(client: ReturnType<typeof createQueryClient>) {
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((query) => ({ key: query.queryKey, state: query.state })),
    ),
  ).not.toContain(secret.proof);
  expect(
    JSON.stringify(
      client
        .getMutationCache()
        .getAll()
        .map((mutation) => mutation.state),
    ),
  ).not.toContain(secret.proof);
  expect(JSON.stringify(localStorage)).not.toContain(secret.proof);
  expect(JSON.stringify(sessionStorage)).not.toContain(secret.proof);
  expect(screen.getByLabelText("Current location")).not.toHaveTextContent(
    secret.proof,
  );
  expect(document.body.textContent).not.toContain(secret.proof);
}
async function previewReady() {
  await screen.findByRole(
    "button",
    { name: "Accept invitation" },
    { timeout: 4000 },
  );
}
describe("project invitation proof lifecycle", () => {
  it("discards a late acceptance after an account change", async () => {
    establishOrganizationSession();
    let finish: (value: { projectId: string }) => void = () => {
      throw new Error("Acceptance not started");
    };
    const accept = vi
      .spyOn(getProjectInvitationResponseRepository(), "accept")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const { flow, client } = harness();
    await previewReady();
    await userEvent.click(
      screen.getByRole("button", { name: "Accept invitation" }),
    );
    expect(accept).toHaveBeenCalledOnce();
    act(() => {
      establishOrganizationSession(ids.otherUser);
    });
    await screen.findByRole("heading", { name: unavailable });
    await act(async () => {
      finish({ projectId: firstProject.detail.id });
      await Promise.resolve();
    });
    expect(flow.get()).toBeUndefined();
    expect(screen.getByLabelText("Current location")).toHaveTextContent(
      ROUTES.joinProject,
    );
    expect(screen.queryByText(/^You joined /)).not.toBeInTheDocument();
    noProof(client);
  });
  it("aborts an acceptance on unmount and ignores its late response", async () => {
    establishOrganizationSession();
    let finish: (value: { projectId: string }) => void = () => {
      throw new Error("Acceptance not started");
    };
    const accept = vi
      .spyOn(getProjectInvitationResponseRepository(), "accept")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    const { flow, unmount, client } = harness();
    await previewReady();
    await userEvent.click(
      screen.getByRole("button", { name: "Accept invitation" }),
    );
    expect(accept).toHaveBeenCalledOnce();
    const signal = accept.mock.calls[0]?.[3];
    unmount();
    await waitFor(() => {
      expect(flow.get()).toBeUndefined();
    });
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      finish({ projectId: firstProject.detail.id });
      await Promise.resolve();
    });
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(document.body.textContent).not.toContain(secret.proof);
  });
  it("captures and scrubs the structured fragment before rendering and rejects malformed or duplicate fields", () => {
    const previous = window.location.pathname + window.location.search;
    window.history.replaceState(
      {},
      "",
      `${ROUTES.joinProject}#invitationId=${secret.invitationId}&proof=${secret.proof}`,
    );
    const captured = captureProjectInvitationFragment();
    expect(captured).toEqual(secret);
    expect(window.location.hash).toBe("");
    harness(createProjectInvitationFlow(captured));
    expect(
      screen.getByText(
        "Sign in with the email address this invitation was sent to.",
      ),
    ).toBeVisible();
    expect(
      parseProjectInvitationFragment(
        `#invitationId=${secret.invitationId}&proof=a&proof=b`,
      ),
    ).toBeUndefined();
    expect(
      parseProjectInvitationFragment("#invitationId=bad&proof=nonempty"),
    ).toBeUndefined();
    expect(
      parseProjectInvitationFragment(
        `#invitationId=${secret.invitationId}&proof=`,
      ),
    ).toBeUndefined();
    expect(
      parseProjectInvitationFragment(
        `#invitationId=${secret.invitationId}&proof=x`,
      )?.proof,
    ).toBe("x");
    window.history.replaceState({}, "", previous);
  });
  it("survives StrictMode and same-tab sign-in without secret navigation state or caches", async () => {
    server.use(
      http.post(`${apiBase}/auth/login`, () =>
        success({
          userId: ids.user,
          accessToken: "test.header.signature",
          tokenType: "Bearer",
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        }),
      ),
    );
    const { client, flow } = harness(),
      user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Continue to sign in" }));
    await user.type(
      screen.getByLabelText("Email"),
      "grace.liu@larkspur.example",
    );
    await user.type(screen.getByLabelText("Password"), "fictional-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await previewReady();
    expect(screen.getByText("Linh Pham invited you to")).toBeVisible();
    expect(screen.getByText("Your role: BA")).toBeVisible();
    expect(flow.get()).toEqual(secret);
    noProof(client);
  });
  it("does not resume a flow retired while sign-in was already mounted", async () => {
    server.use(
      http.post(`${apiBase}/auth/login`, () =>
        success({
          userId: ids.user,
          accessToken: "test.header.signature",
          tokenType: "Bearer",
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        }),
      ),
    );
    const { flow } = harness(),
      user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Continue to sign in" }));
    flow.clear();
    await user.type(
      screen.getByLabelText("Email"),
      "grace.liu@larkspur.example",
    );
    await user.type(screen.getByLabelText("Password"), "fictional-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByRole("heading", { name: "Workspaces" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Accept invitation" }),
    ).not.toBeInTheDocument();
  });
  it("retires on registration and abandonment", async () => {
    const { flow } = harness(),
      user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Continue to sign in" }));
    await user.click(screen.getByRole("link", { name: "Register" }));
    await waitFor(() => {
      expect(flow.get()).toBeUndefined();
    });
    await user.click(screen.getByRole("link", { name: "Abandon invitation" }));
    expect(flow.get()).toBeUndefined();
  });
  it("retires on real unmount after the StrictMode replay", async () => {
    establishOrganizationSession();
    const { flow, unmount, client } = harness();
    await previewReady();
    unmount();
    await waitFor(() => {
      expect(flow.get()).toBeUndefined();
    });
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });
  it("discards a pending preview and its proof on account change", async () => {
    establishOrganizationSession();
    const previewCall = vi.spyOn(
      getProjectInvitationResponseRepository(),
      "preview",
    );
    const { flow, client } = harness();
    await screen.findByRole("status", { name: "Checking your invitation" });
    await waitFor(() => {
      expect(previewCall).toHaveBeenCalled();
    });
    act(() => {
      establishOrganizationSession(ids.otherUser);
    });
    expect(
      await screen.findByRole("heading", { name: unavailable }),
    ).toBeVisible();
    expect(flow.get()).toBeUndefined();
    expect(screen.queryByText(fixture.projectName)).not.toBeInTheDocument();
    noProof(client);
  });
  it("performs no lookup without a retained proof, including after reload", async () => {
    establishOrganizationSession();
    const call = vi.spyOn(getProjectInvitationResponseRepository(), "preview");
    const { client } = harness(createProjectInvitationFlow());
    expect(
      await screen.findByRole("heading", { name: unavailable }),
    ).toBeVisible();
    expect(call).not.toHaveBeenCalled();
    noProof(client);
  });
});
describe("project invitation situations", () => {
  it("keeps network recovery in memory and sanitizes raw failure text", async () => {
    establishOrganizationSession();
    const repo = getProjectInvitationResponseRepository();
    vi.spyOn(repo, "preview").mockRejectedValueOnce(
      new ApiError("network", secret.proof),
    );
    const { client, flow } = harness(undefined, false),
      user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Try again" }));
    await previewReady();
    expect(flow.get()).toEqual(secret);
    noProof(client);
  });
  it("shows email mismatch and local sign-out retires the proof", async () => {
    establishOrganizationSession();
    __setMockPersona("u-tomasz");
    const { flow, client } = harness();
    expect(
      await screen.findByText(
        "This invitation is for a different email address. Sign out and sign in with the invited address.",
      ),
    ).toBeVisible();
    expect(flow.get()).toBeUndefined();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    expect(authSession.getSnapshot().status).toBe("anonymous");
    noProof(client);
  });
  it("presents a vendor-member rejection without suggesting workspace membership was granted", async () => {
    establishOrganizationSession();
    vi.spyOn(
      getProjectInvitationResponseRepository(),
      "preview",
    ).mockRejectedValue(new ProjectInvitationError("member"));
    const { flow } = harness();
    expect(
      await screen.findByText(
        "You're a member of this vendor's workspace. Ask a project administrator to add you to the team instead.",
      ),
    ).toBeVisible();
    expect(flow.get()).toBeUndefined();
  });
  it.each([
    "expired",
    "used",
    "cancelled",
    "rotated",
    "inviter lost permission",
  ])("shows one non-disclosing terminal presentation for %s", async () => {
    establishOrganizationSession();
    vi.spyOn(
      getProjectInvitationResponseRepository(),
      "preview",
    ).mockRejectedValue(new ProjectInvitationError("unavailable"));
    const { flow, client } = harness();
    expect(
      await screen.findByRole("heading", { name: unavailable }),
    ).toBeVisible();
    expect(screen.queryByText(fixture.projectName)).not.toBeInTheDocument();
    expect(flow.get()).toBeUndefined();
    noProof(client);
  });
  it("displays the approved former-member note from the repository outcome", async () => {
    establishOrganizationSession();
    vi.spyOn(
      getProjectInvitationResponseRepository(),
      "preview",
    ).mockResolvedValue({
      kind: "preview",
      preview: { ...fixture, replacesFormerMembership: true },
    });
    harness();
    await previewReady();
    expect(
      screen.getByText(
        "Accepting ends your previous team membership on this project and adds you as a guest.",
      ),
    ).toBeVisible();
  });
  it("shows Already a guest with a scoped Open project link", async () => {
    establishOrganizationSession();
    const repo = getProjectInvitationResponseRepository();
    await repo.accept(secret.invitationId, secret.proof, fixture.version);
    const { flow } = harness();
    expect(
      await screen.findByRole("heading", {
        name: "You already have access to this project.",
      }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Open project" })).toHaveAttribute(
      "href",
      portalProjectPath(firstProject.detail.id),
    );
    expect(flow.get()).toBeUndefined();
  });
  it("accepts as a guest, retires the proof, navigates and focuses the portal result heading", async () => {
    establishOrganizationSession();
    const { client, flow } = harness();
    await previewReady();
    await userEvent.click(
      screen.getByRole("button", { name: "Accept invitation" }),
    );
    expect(
      await screen.findByText(
        `You joined ${fixture.projectName}. (sample data — not saved to a server)`,
        {},
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(screen.getByLabelText("Current location")).toHaveTextContent(
      portalProjectPath(firstProject.detail.id),
    );
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { level: 1, name: fixture.projectName }),
      ).toHaveFocus();
    });
    expect(flow.get()).toBeUndefined();
    noProof(client);
  });
  it("retains same-proof acceptance recovery without admitting a duplicate guest", async () => {
    establishOrganizationSession();
    const repo = getProjectInvitationResponseRepository(),
      accept = repo.accept.bind(repo);
    vi.spyOn(repo, "accept").mockImplementationOnce(async (...args) => {
      await accept(...args);
      throw new ApiError("network", secret.proof);
    });
    const { flow, client } = harness();
    await previewReady();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Accept invitation" }));
    await screen.findByRole("button", { name: "Try again" });
    expect(flow.get()).toEqual(secret);
    noProof(client);
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByText(
        `You joined ${fixture.projectName}. (sample data — not saved to a server)`,
        {},
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(flow.get()).toBeUndefined();
  });
  it("confirms decline, handles an error, focuses the result and retires the proof", async () => {
    establishOrganizationSession();
    const { flow, client } = harness();
    await previewReady();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Decline" }));
    const dialog = within(
      screen.getByRole("dialog", {
        name: `Decline invitation: ${fixture.projectName}`,
      }),
    );
    __setMockFailure("projectInvitations.decline", "server");
    await user.click(dialog.getByRole("button", { name: "Decline" }));
    await dialog.findByRole("alert");
    expect(flow.get()).toEqual(secret);
    __setMockFailure("projectInvitations.decline", null);
    await user.click(dialog.getByRole("button", { name: "Try again" }));
    const heading = await screen.findByRole("heading", {
      name: "You declined the invitation.",
    });
    await waitFor(() => {
      expect(heading).toHaveFocus();
    });
    expect(
      screen.getByRole("link", { name: "Go to client portal" }),
    ).toHaveAttribute("href", ROUTES.portal);
    expect(flow.get()).toBeUndefined();
    noProof(client);
  });
});
