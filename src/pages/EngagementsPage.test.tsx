import { useEffect } from "react";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { matchPath, useLocation, useNavigate } from "react-router";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEngagementRepository } from "@/features/engagements/api/engagementRepository";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import {
  organizationIds as ids,
  organizationFixtures as f,
} from "@/mocks/workspaces";
import { engagementFixtures } from "@/mocks/engagements";
import { MOCK_PEOPLE } from "@/mocks/people";
import { ROUTES, workspaceEngagementsPath } from "@/lib/routes";
import {
  establishOrganizationSession,
  organizationReadHandlers,
  orgBase,
  failure,
  success,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";
import { server } from "@/test/mocks/server";

const path = workspaceEngagementsPath(ids.organization);
type Navigation = { pathname: string; state: unknown };
function NavigationProbe({
  onChange,
}: {
  onChange: (location: Navigation) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    onChange({ pathname: location.pathname, state: location.state });
  }, [location, onChange]);
  return (
    <button
      onClick={() => {
        void navigate(-1);
      }}
    >
      Go back
    </button>
  );
}
function renderPage(
  search = "",
  observer = vi.fn<(location: Navigation) => void>(),
) {
  return {
    ...renderOrganizationRoute(
      `${path}${search}`,
      undefined,
      <NavigationProbe onChange={observer} />,
    ),
    observer,
  };
}
const table = () => within(screen.getByRole("table", { name: "Engagements" }));
async function openCreate() {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole("button", { name: "Create engagement" }),
  );
  return {
    user,
    dialog: within(screen.getByRole("dialog", { name: "Create engagement" })),
  };
}
async function fillCreate(
  dialog: Pick<typeof screen, "getByLabelText">,
  user: ReturnType<typeof userEvent.setup>,
  reference = "UI-TEST",
) {
  await user.type(
    dialog.getByLabelText("Client display name"),
    "Created sample client",
  );
  await user.type(dialog.getByLabelText("Agreement reference"), reference);
  fireEvent.change(dialog.getByLabelText("Agreement signed on"), {
    target: { value: "2026-11-02" },
  });
}
beforeEach(() => {
  __resetMocks();
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
});
afterEach(() => {
  __resetMocks();
});

describe("engagement list outcomes", () => {
  it("loads five skeleton rows, then the approved active table and sample banner", async () => {
    renderPage();
    const loading = await screen.findByText("Loading engagements");
    expect(
      loading
        .closest('[role="status"]')
        ?.querySelectorAll('[data-slot="skeleton"]'),
    ).toHaveLength(5);
    await screen.findByRole("table", { name: "Engagements" });
    expect(
      table().getByRole("rowheader", { name: "Larkspur Retail Group" }),
    ).toHaveAttribute("scope", "row");
    expect(table().getByText("15 Sep 2026")).toBeVisible();
    expect(table().getByText("1 of 4 achieved")).toBeVisible();
    expect(screen.getByText("2 engagements")).toBeVisible();
    expect(
      screen.getByText(/Sample data. This page is not connected/),
    ).toBeVisible();
    expect(table().queryByText("185,000")).not.toBeInTheDocument();
  });
  it("renders empty without grants, hides creation and does not turn a role label into access", async () => {
    __setMockPersona("u-sofia");
    server.use(
      http.get(`${orgBase}/members/me`, () =>
        success({ ...f.member, roles: f.otherMember.roles }),
      ),
    );
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "No engagements yet" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Create engagement" }),
    ).not.toBeInTheDocument();
    const sidebar = within(
      screen.getByRole("complementary", { name: "Workspace sidebar" }),
    );
    expect(
      sidebar.queryByRole("link", { name: "Engagements" }),
    ).not.toBeInTheDocument();
  });
  it("offers the create action when the repository returns no records", async () => {
    vi.spyOn(getEngagementRepository(), "list").mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    renderPage();
    expect(
      await screen.findByRole("heading", { name: "No engagements yet" }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Record a client agreement to create client projects under it.",
      ),
    ).toBeVisible();
    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "Create engagement" }),
      ).toHaveLength(2);
    });
  });
  it("searches loaded client/name/reference text, announces counts and clears filters", async () => {
    const list = vi.spyOn(getEngagementRepository(), "list");
    renderPage();
    await screen.findByRole("table", { name: "Engagements" });
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Search"), "HL-SOW");
    expect(table().getAllByRole("rowheader")).toHaveLength(1);
    expect(table().getByText("Halden Logistics")).toBeVisible();
    expect(screen.getByText("1 engagement")).toBeVisible();
    await user.clear(screen.getByLabelText("Search"));
    await user.type(screen.getByLabelText("Search"), "no match");
    expect(
      screen.getByRole("heading", {
        name: "No engagements match these filters.",
      }),
    ).toBeVisible();
    await user.click(
      screen.getAllByRole("button", { name: "Clear filters" })[0] ??
        screen.getByLabelText("Search"),
    );
    expect(table().getAllByRole("rowheader")).toHaveLength(2);
    expect(list).toHaveBeenCalledOnce();
  });
  it("restores URL status/search with browser back navigation", async () => {
    renderPage("?status=Closed&q=BWC");
    await screen.findByRole("table", { name: "Engagements" });
    expect(table().getByText("Brightwater Clinics")).toBeVisible();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => {
      expect(table().getAllByRole("rowheader")).toHaveLength(2);
    });
    await user.click(screen.getByRole("button", { name: "Go back" }));
    await waitFor(() => {
      expect(table().getByText("Brightwater Clinics")).toBeVisible();
    });
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Closed",
    );
    expect(screen.getByLabelText("Search")).toHaveValue("BWC");
  });
  it("shows a recoverable error and retries deliberately", async () => {
    __setMockFailure("engagements.list", "server");
    renderPage();
    expect(await screen.findByText("Could not load engagements")).toBeVisible();
    __setMockFailure("engagements.list", null);
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(
      await screen.findByRole("table", { name: "Engagements" }),
    ).toBeVisible();
  });
  it("fails closed while Identity is unavailable", async () => {
    const list = vi.spyOn(getEngagementRepository(), "list");
    server.use(
      http.get(`${orgBase}/members/me`, () =>
        failure(503, "Identity.Unavailable"),
      ),
    );
    renderPage();
    expect(
      await screen.findByText(
        "We couldn't confirm your access right now. Try again in a moment.",
      ),
    ).toBeVisible();
    expect(list).not.toHaveBeenCalled();
  });
  it("runs real admission before any fixture read and handles admission denial", async () => {
    const list = vi.spyOn(getEngagementRepository(), "list");
    server.use(
      http.get(`${orgBase}/members/me`, () =>
        failure(403, "Organization.NotMember"),
      ),
    );
    renderPage();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Your workspaces" }),
    ).toBeVisible();
    expect(list).not.toHaveBeenCalled();
    expect(screen.queryByText("Larkspur Retail Group")).not.toBeInTheDocument();
  });
  it("appends cursor pages and describes the loaded-only search boundary", async () => {
    const repo = getEngagementRepository();
    await Promise.all(
      Array.from({ length: 51 }, (_, index) =>
        repo.create(
          ids.organization,
          {
            clientDisplayName: `Sample ${String(index)}`,
            agreementReference: `P-${String(index)}`,
            agreementSignedOn: "2026-11-02",
          },
          crypto.randomUUID(),
        ),
      ),
    );
    renderPage();
    await screen.findByRole("table", { name: "Engagements" });
    expect(table().getAllByRole("rowheader")).toHaveLength(50);
    expect(screen.getByText("Searches loaded results.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => {
      expect(table().getAllByRole("rowheader")).toHaveLength(53);
    });
    expect(
      screen.queryByRole("button", { name: "Load more" }),
    ).not.toBeInTheDocument();
  });
});
describe("engagement creation", () => {
  it("rejects a 201-character name and an http document link before creating", async () => {
    const create = vi.spyOn(getEngagementRepository(), "create");
    renderPage();
    const { user, dialog } = await openCreate();
    expect(dialog.getByLabelText("Client display name")).toHaveFocus();
    await user.click(dialog.getByLabelText("Client display name"));
    await user.paste("N".repeat(201));
    await user.tab();
    expect(
      await dialog.findByText("Use 200 characters or fewer."),
    ).toBeVisible();
    await user.type(
      dialog.getByLabelText("Agreement document link (optional)"),
      "http://example.com",
    );
    await user.tab();
    expect(
      await dialog.findByText("Enter a link that starts with https://."),
    ).toBeVisible();
    await user.click(dialog.getByRole("button", { name: "Create engagement" }));
    expect(create).not.toHaveBeenCalled();
  });
  it("carries duplicate warning state to page 09 and records Active creator attribution", async () => {
    const capabilities = vi.spyOn(getEngagementRepository(), "capabilities");
    const { observer } = renderPage();
    const { user, dialog } = await openCreate();
    const reference = engagementFixtures.items[0]?.agreementReference;
    if (!reference) throw new Error("Missing reference");
    await fillCreate(dialog, user, reference);
    await user.click(dialog.getByRole("button", { name: "Create engagement" }));
    expect(
      await screen.findByRole(
        "heading",
        {
          level: 1,
          name: "Created sample client",
        },
        { timeout: 3000 },
      ),
    ).toBeVisible();
    const navigation = observer.mock.lastCall?.[0];
    if (!navigation) throw new Error("Missing navigation");
    expect(navigation.state).toMatchObject({
      duplicateAgreementReference: true,
      engagementCreated: true,
      mock: true,
      message: "Engagement created.",
    });
    expect(
      screen.getByText(
        `Another active engagement in this workspace uses agreement reference ${reference}. Check that this is not a duplicate.`,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Engagement created. (sample data — not saved to a server)",
      ),
    ).toBeVisible();
    expect(capabilities).toHaveBeenCalledOnce();
    const id = matchPath(ROUTES.workspaceEngagement, navigation.pathname)
      ?.params.engagementId;
    if (!id) throw new Error("Missing created id");
    const row = await getEngagementRepository().get(ids.organization, id);
    expect(row.status).toBe("Active");
    expect(row.createdByUserId).toBe(
      MOCK_PEOPLE.find((person) => person.key === "u-linh")?.id,
    );
  });
  it("shows the exact 403 submit copy", async () => {
    __setMockFailure("engagements.create", "forbidden");
    renderPage();
    const { user, dialog } = await openCreate();
    await fillCreate(dialog, user);
    await user.click(dialog.getByRole("button", { name: "Create engagement" }));
    expect(
      await within(screen.getByRole("dialog")).findByRole("alert"),
    ).toHaveTextContent("You no longer have permission to create engagements.");
  });
  it("retains the same idempotency attempt across an uncertain retry and dialog closure", async () => {
    __setMockFailure("engagements.create", "server");
    const create = vi.spyOn(getEngagementRepository(), "create");
    renderPage();
    const { user, dialog } = await openCreate();
    await fillCreate(dialog, user, "RETRY-TEST");
    await user.click(dialog.getByRole("button", { name: "Create engagement" }));
    await screen.findByText(/The outcome is unknown/);
    expect(screen.getByLabelText("Client display name")).toHaveAttribute(
      "readonly",
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Create engagement" }));
    expect(screen.getByLabelText("Agreement reference")).toHaveValue(
      "RETRY-TEST",
    );
    __setMockFailure("engagements.create", null);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create engagement",
      }),
    );
    await screen.findByRole(
      "heading",
      {
        level: 1,
        name: "Created sample client",
      },
      { timeout: 3000 },
    );
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0]?.[2]).toBe(create.mock.calls[1]?.[2]);
    expect(create.mock.calls[0]?.[1]).toEqual(create.mock.calls[1]?.[1]);
  });
});
