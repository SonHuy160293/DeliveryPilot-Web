import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ProjectInvitationNotice } from "@/features/projects/guest-invitations/recipient/ProjectInvitationNotice";
import { ProjectInvitationLoading } from "@/features/projects/guest-invitations/recipient/ProjectInvitationLoading";
import { ProjectInvitationSignedOut } from "@/features/projects/guest-invitations/recipient/ProjectInvitationSignedOut";
import { ROUTES } from "@/lib/routes";
describe("project invitation presentations", () => {
  it("announces checking while exposing skeletons", () => {
    render(<ProjectInvitationLoading />);
    expect(
      screen.getByRole("status", { name: "Checking your invitation" }),
    ).toHaveAttribute("aria-busy", "true");
  });
  it("provides a proof-free same-tab sign-in link", () => {
    render(
      <MemoryRouter>
        <ProjectInvitationSignedOut />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("link", { name: "Continue to sign in" }),
    ).toHaveAttribute("href", ROUTES.signIn);
    expect(
      screen.getByText(
        "Sign in with the email address this invitation was sent to.",
      ),
    ).toBeVisible();
  });
  it("focuses the declined result and links to the client portal", async () => {
    render(
      <MemoryRouter>
        <ProjectInvitationNotice kind="declined" onSignOut={() => undefined} />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "You declined the invitation." }),
      ).toHaveFocus();
    });
    expect(
      screen.getByRole("link", { name: "Go to client portal" }),
    ).toHaveAttribute("href", ROUTES.portal);
    expect(screen.getByText(/sample data/)).toBeVisible();
  });
  it("offers a keyboard-accessible sign-out for an email mismatch", async () => {
    const signOut = vi.fn();
    render(
      <MemoryRouter>
        <ProjectInvitationNotice kind="mismatch" onSignOut={signOut} />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("button", { name: "Sign out" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(signOut).toHaveBeenCalledOnce();
  });
});
