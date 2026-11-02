import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/router";
import { authSession } from "@/lib/api/authSession";
import { createQueryClient } from "@/lib/query/queryClient";
import { ROUTES } from "@/lib/routes";
import { renderRoute } from "@/test/renderRoute";
import { server } from "@/test/mocks/server";

const endpoint = `${window.location.origin}/identity/api/v1/auth/register`;
const credentials = {
  displayName: "Test recipient",
  email: "recipient@example.test",
  password: "fictional-password",
};
const success = () =>
  HttpResponse.json(
    {
      success: true,
      data: { userId: "00000000-0000-0000-0000-000000000001" },
      error: null,
    },
    { status: 201 },
  );
async function fill() {
  const user = userEvent.setup();
  await user.type(
    screen.getByLabelText("Display name"),
    credentials.displayName,
  );
  await user.type(screen.getByLabelText("Email"), credentials.email);
  await user.type(screen.getByLabelText("Password"), credentials.password);
  return user;
}

describe("connected registration", () => {
  it("validates required fields and focuses the first invalid input", async () => {
    renderRoute(ROUTES.signUp);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByLabelText("Display name")).toHaveFocus();
    expect(screen.getByLabelText("Display name")).toHaveAccessibleDescription(
      "Enter your display name.",
    );
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter your email address.",
    );
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Enter your password.",
    );
  });
  it("validates on blur and clears corrected errors without inventing a password policy", async () => {
    renderRoute(ROUTES.signUp);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "invalid");
    await user.tab();
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(
      "Enter a valid email address.",
    );
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), credentials.email);
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    await user.type(screen.getByLabelText("Display name"), "   ");
    await user.type(screen.getByLabelText("Password"), "   ");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(screen.getByLabelText("Display name")).toHaveFocus();
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription(
      "Enter your password.",
    );
  });
  it("creates an account through the real adapter without storing secrets or establishing a session", async () => {
    const fetchRequest = vi.spyOn(globalThis, "fetch");
    let calls = 0;
    server.use(
      http.post(endpoint, async ({ request }) => {
        calls++;
        expect(await request.json()).toEqual({
          ...credentials,
          displayName: "Test recipient",
          password: "x",
        });
        expect(request.headers.has("Authorization")).toBe(false);
        return success();
      }),
    );
    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`${ROUTES.signUp}?state=success`]}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const user = await fill();
    await user.clear(screen.getByLabelText("Password"));
    await user.type(screen.getByLabelText("Password"), "x");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Account created. Sign in to continue.",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "reopen the original invitation email",
    );
    expect(calls).toBe(1);
    expect(fetchRequest.mock.calls[0]?.[0]).toMatchObject({
      credentials: "omit",
    });
    expect(authSession.getSnapshot().status).toBe("anonymous");
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expect(JSON.stringify(localStorage)).not.toContain(credentials.email);
    expect(JSON.stringify(sessionStorage)).not.toContain(credentials.password);
    await user.click(screen.getByRole("link", { name: "Continue to sign in" }));
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(screen.getByLabelText("Password")).toHaveValue("");
  });
  it.each([
    [
      409,
      "Registration.EmailExists",
      "An account already uses this email. Sign in to continue.",
    ],
    [
      422,
      "Validation.Failed",
      "Check your display name, email and password, then try again.",
    ],
    [
      403,
      "Registration.Disabled",
      "Account creation is unavailable. Contact your administrator.",
    ],
    [
      503,
      "Unavailable",
      "Account creation could not be confirmed. Try signing in before submitting again.",
    ],
  ])("handles %s safely and preserves input", async (status, code, message) => {
    let calls = 0;
    server.use(
      http.post(endpoint, () => {
        calls++;
        return HttpResponse.json(
          {
            success: false,
            error: { code, message: "private server detail" },
            data: null,
          },
          { status },
        );
      }),
    );
    renderRoute(ROUTES.signUp);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText("private server detail")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue(credentials.email);
    expect(calls).toBe(1);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("honors Retry-After without automatically retrying", async () => {
    let calls = 0;
    server.use(
      http.post(endpoint, () => {
        calls++;
        return HttpResponse.json(
          {},
          { status: 429, headers: { "Retry-After": "60" } },
        );
      }),
    );
    renderRoute(ROUTES.signUp);
    const user = await fill();
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts",
    );
    expect(
      screen.getByRole("button", { name: "Wait before trying again" }),
    ).toBeDisabled();
    expect(calls).toBe(1);
  });
  it("prevents duplicate submissions while pending and ignores late success after leaving", async () => {
    let calls = 0;
    let release: () => void = () => {};
    server.use(
      http.post(endpoint, async () => {
        calls++;
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return success();
      }),
    );
    renderRoute(ROUTES.signUp);
    const user = await fill();
    await user.dblClick(screen.getByRole("button", { name: "Create account" }));
    await waitFor(() => {
      expect(calls).toBe(1);
    });
    expect(
      screen.getByRole("button", { name: "Creating account…" }),
    ).toBeDisabled();
    const signIn = screen
      .getAllByRole("link", { name: "Sign in" })
      .find((link) => link.closest("main"));
    expect(signIn).toBeDefined();
    if (!signIn) throw new Error("Missing sign-in link");
    await user.click(signIn);
    await act(async () => {
      release();
      await delay(10);
    });
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(screen.queryByText(/Account created/)).not.toBeInTheDocument();
  });
});
