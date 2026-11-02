import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { authSession } from "@/lib/api/authSession";
import { ROUTES } from "@/lib/routes";
import { renderRoute } from "@/test/renderRoute";

const pages = [
  [ROUTES.home, /Know what’s committed/],
  [ROUTES.signIn, /^Sign in$/],
  [ROUTES.signUp, /Create an account/],
  ["/unknown-address", /Page not found/],
] as const;
describe("approved routes", () => {
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
