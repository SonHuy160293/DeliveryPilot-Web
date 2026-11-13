import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEngagementRepository } from "@/features/engagements/api/engagementRepository";
import { engagementHistoryFixtures } from "@/mocks/engagements";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { ApiError } from "@/lib/api/apiError";
import {
  establishOrganizationSession,
  organizationReadHandlers,
  orgBase,
  failure,
} from "@/test/fixtures/organizationApi";
import {
  renderDetail,
  detailReady,
  detailFixture,
  closedFixture,
  detailWorkspaceId,
  milestoneTable,
} from "@/test/fixtures/engagementDetail";
import { server } from "@/test/mocks/server";
import { workspaceEngagementsPath, workspaceProjectsPath } from "@/lib/routes";

beforeEach(() => {
  __resetMocks();
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
});
afterEach(() => {
  __resetMocks();
});

describe("engagement detail states and access", () => {
  it("loads header/tab skeletons, then the real admitted breadcrumb and read-only detail", async () => {
    renderDetail();
    const loading = await screen.findByText("Loading engagement.");
    expect(
      loading
        .closest('[role="status"]')
        ?.querySelectorAll('[data-slot="skeleton"]'),
    ).toHaveLength(3);
    await detailReady();
    expect(
      screen.getByText(
        /Loyalty platform rebuild · LRG-2026-014 · Signed 15 Sep 2026/,
      ),
    ).toBeVisible();
    expect(
      screen.getByText(/You can view this engagement. Editing needs/),
    ).toBeVisible();
    const details = within(
      screen.getByRole("region", { name: "Engagement details" }),
    );
    expect(details.getByText("Larkspur Retail Group Pty Ltd")).toBeVisible();
    expect(details.getByText(/by Linh Pham/)).toBeVisible();
    expect(
      details.getByRole("link", { name: "Open document (opens in a new tab)" }),
    ).toHaveAttribute("rel", "noreferrer noopener");
    expect(
      screen.getByRole("link", { name: "Create project" }),
    ).toHaveAttribute(
      "href",
      `${workspaceProjectsPath(detailWorkspaceId)}?create=1&engagementId=${detailFixture.id}`,
    );
    expect(
      screen.queryByRole("button", { name: "Edit details" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Sample data. This page is not connected/),
    ).toBeVisible();
  });
  it.each(["contract", "milestones"])(
    "read-all without manage has no edit controls on %s",
    async (tab) => {
      renderDetail(tab);
      await detailReady();
      expect(
        screen.queryByRole("button", {
          name: /Set contract value|Add milestone|Edit|Change date|Change status|Close engagement|Reopen engagement/,
        }),
      ).not.toBeInTheDocument();
    },
  );
  it.each(["missing", "denied", "forbidden"])(
    "masks %s full-detail access and never queries history",
    async (outcome) => {
      const history = vi.spyOn(getEngagementRepository(), "history");
      if (outcome === "denied") __setMockPersona("u-sofia");
      if (outcome === "forbidden")
        __setMockFailure("engagements.get", "forbidden");
      renderDetail(
        "history",
        outcome === "missing" ? crypto.randomUUID() : detailFixture.id,
      );
      expect(
        await screen.findByText(
          "This engagement isn't available. It may not exist, or you may not have access.",
        ),
      ).toBeVisible();
      expect(
        screen.getByRole("link", { name: "Back to engagements" }),
      ).toHaveAttribute("href", workspaceEngagementsPath(detailWorkspaceId));
      expect(
        screen.queryByRole("tab", { name: "Contract" }),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/185,000/)).not.toBeInTheDocument();
      expect(history).not.toHaveBeenCalled();
    },
  );
  it("fails workspace admission before any engagement read", async () => {
    const get = vi.spyOn(getEngagementRepository(), "get");
    server.use(
      http.get(`${orgBase}/members/me`, () => failure(403, "Forbidden")),
    );
    renderDetail();
    await screen.findByRole("heading", { name: "Workspaces" });
    expect(get).not.toHaveBeenCalled();
  });
  it("retries a read failure and ignores preview state queries", async () => {
    __setMockFailure("engagements.get", "server");
    renderDetail("details&state=success");
    await screen.findByText("Could not load engagement");
    expect(screen.queryByText(/Preview state/)).not.toBeInTheDocument();
    __setMockFailure("engagements.get", null);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    await detailReady();
  });
  it("hides authority-dependent actions while capabilities are unknown or failed", async () => {
    __setMockPersona("u-mai");
    vi.spyOn(getEngagementRepository(), "detailCapabilities").mockRejectedValue(
      new ApiError("server", "Unavailable", { status: 503 }),
    );
    renderDetail("contract");
    await detailReady();
    expect(
      screen.queryByRole("button", {
        name: /Set contract value|Close engagement/,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create project" }),
    ).not.toBeInTheDocument();
  });
  it("keeps Closed read-only through keyboard tab navigation", async () => {
    __setMockPersona("u-mai");
    renderDetail("contract", closedFixture.id);
    await detailReady(closedFixture.clientDisplayName);
    expect(
      screen.getByText(
        "This engagement is closed. Closed engagements are read-only. Reopen it to make changes.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Create project" }),
    ).not.toBeInTheDocument();
    const user = userEvent.setup();
    screen.getByRole("tab", { name: "Contract" }).focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: /Milestones/ })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    expect(
      screen.queryByRole("button", {
        name: /Set contract value|Add milestone|Edit|Change date|Change status|Close engagement/,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reopen engagement" }),
    ).toBeEnabled();
    for (let index = 0; index < 12; index++) {
      await user.tab();
      const focused = document.activeElement;
      if (focused instanceof HTMLButtonElement)
        expect(focused).not.toHaveAccessibleName(
          /Set contract value|Add milestone|Change date|Change status|Close engagement/,
        );
    }
  });
  it("syncs arrow-key tabs using replace and preserves unrelated params", async () => {
    renderDetail("details&keep=1");
    await detailReady();
    const user = userEvent.setup();
    screen.getByRole("tab", { name: "Details" }).focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByLabelText("Current search")).toHaveTextContent(
        "tab=contract&keep=1",
      ),
    );
    expect(screen.getByLabelText("Navigation type")).toHaveTextContent(
      "REPLACE",
    );
    for (const name of ["Contacts", "Projects", "Client link"]) {
      await user.click(
        screen.getByRole("tab", { name: new RegExp(`^${name}`) }),
      );
      expect(screen.getByRole("heading", { name, level: 2 })).toBeVisible();
    }
  });
  it("shows empty milestones with a manage-only next step", async () => {
    __setMockPersona("u-mai");
    const get = vi.spyOn(getEngagementRepository(), "get");
    get.mockResolvedValue({
      ...detailFixture,
      organizationId: detailWorkspaceId,
      milestones: [],
    });
    renderDetail("milestones");
    await detailReady();
    expect(
      screen.getByRole("heading", { name: "No milestones yet" }),
    ).toBeVisible();
    expect(
      screen.getByText("Add the delivery dates agreed with the client."),
    ).toBeVisible();
    expect(
      await screen.findByRole("button", { name: "Add milestone" }),
    ).toBeEnabled();
  });
  it("renders history labels, safe previous/new pairs and cursor pagination", async () => {
    const first = engagementHistoryFixtures.items[0];
    if (!first) throw new Error("Missing history fixture");
    const history = vi.spyOn(getEngagementRepository(), "history");
    history
      .mockResolvedValueOnce({
        items: [
          first,
          {
            ...first,
            id: crypto.randomUUID(),
            eventType: "Unrecognized",
            details: { secret: "never render this" },
          },
        ],
        nextCursor: "next",
      })
      .mockResolvedValueOnce({
        items: [
          { ...first, id: crypto.randomUUID(), eventType: "EngagementClosed" },
        ],
        nextCursor: null,
      });
    renderDetail("history");
    await detailReady();
    const table = within(
      await screen.findByRole("table", { name: "Engagement history" }),
    );
    expect(table.getByText("Milestone date changed")).toBeVisible();
    expect(table.getByText("Engagement updated")).toBeVisible();
    expect(
      table.getByText("Target date: 15 Dec 2026 → 12 Jan 2027"),
    ).toBeVisible();
    expect(screen.queryByText("never render this")).not.toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Load more" }));
    expect(await table.findByText("Engagement closed")).toBeVisible();
    expect(history.mock.lastCall?.[2]).toMatchObject({
      cursor: "next",
      limit: 50,
    });
  });
  it("gives terminal milestone rows no actions", async () => {
    __setMockPersona("u-mai");
    renderDetail("milestones");
    await detailReady();
    expect(
      within(
        milestoneTable().getByRole("row", { name: /Discovery sign-off/ }),
      ).queryByRole("button"),
    ).not.toBeInTheDocument();
  });
});
