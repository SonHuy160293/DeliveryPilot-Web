import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { delay, http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/router";
import { login } from "@/features/auth/api/loginApi";
import { SessionCacheObserver } from "@/features/auth/model/SessionCacheObserver";
import { authSession } from "@/lib/api/authSession";
import { httpClient } from "@/lib/api/httpClient";
import { createQueryClient } from "@/lib/query/queryClient";
import { renderRoute } from "@/test/renderRoute";
import { server } from "@/test/mocks/server";

const url = `${window.location.origin}/identity/api/v1/auth/login`;
const token = "header.payload.signature";
const payload = () => ({
  success: true,
  data: {
    userId: "00000000-0000-0000-0000-000000000001",
    accessToken: token,
    tokenType: "Bearer",
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  },
  error: null,
});
async function submit() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), "user@example.com");
  await user.type(screen.getByLabelText("Password"), "test-password");
  await user.click(screen.getByRole("button", { name: /^Sign in$/ }));
  return user;
}
function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe("authentication and protected navigation", () => {
  it("signs in through the verified endpoint, includes cookie credentials and attaches bearer only to configured API requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    server.use(
      http.post(url, async ({ request }) => {
        expect(request.headers.has("authorization")).toBe(false);
        expect(await request.json()).toEqual({
          email: "user@example.com",
          password: "test-password",
        });
        return HttpResponse.json(payload());
      }),
      http.get(
        `${window.location.origin}/identity/test-resource`,
        ({ request }) => {
          expect(request.headers.get("authorization")).toBe(`Bearer ${token}`);
          return HttpResponse.json({ ok: true });
        },
      ),
    );
    renderRoute("/sign-in");
    await submit();
    expect(
      await screen.findByRole("heading", { name: "Workspaces" }),
    ).toBeVisible();
    expect(await screen.findByText(/No workspaces yet/)).toBeVisible();
    expect(authSession.getSnapshot()).toMatchObject({
      status: "authenticated",
    });
    expect(fetchSpy.mock.calls[0]?.[0]).toMatchObject({
      credentials: "include",
      redirect: "error",
    });
    expect((await httpClient.get("test-resource")).data).toEqual({ ok: true });
    expect(JSON.stringify(authSession.getSnapshot())).not.toContain(token);
    expect(JSON.stringify(localStorage)).not.toContain(token);
    expect(JSON.stringify(sessionStorage)).not.toContain(token);
    expect(document.cookie).not.toContain(token);
  });
  it("displays invalid credentials and retains the form without exposing the backend body", async () => {
    server.use(
      http.post(url, () =>
        HttpResponse.json(
          { error: { message: "sensitive backend details" } },
          { status: 401 },
        ),
      ),
    );
    renderRoute("/sign-in");
    await submit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect",
    );
    expect(screen.getByLabelText("Email")).toHaveValue("user@example.com");
    expect(
      screen.queryByText(/sensitive backend details/),
    ).not.toBeInTheDocument();
    expect(authSession.getSnapshot().status).toBe("anonymous");
  });
  it.each([
    { success: false, data: null, error: { message: "private" } },
    {
      success: true,
      data: { ...payload().data, accessToken: "not a jwt" },
      error: null,
    },
    {
      success: true,
      data: { ...payload().data, expiresAt: "invalid" },
      error: null,
    },
    {
      success: true,
      data: { ...payload().data, tokenType: "Basic" },
      error: null,
    },
  ])("rejects failed or malformed responses", async (body) => {
    server.use(http.post(url, () => HttpResponse.json(body)));
    renderRoute("/sign-in");
    await submit();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Could not sign in",
    );
    expect(authSession.getSnapshot().status).toBe("anonymous");
  });
  it("prevents duplicate sign-in while a request is pending", async () => {
    let calls = 0;
    server.use(
      http.post(url, async () => {
        calls++;
        await delay(120);
        return HttpResponse.json(payload());
      }),
    );
    renderRoute("/sign-in");
    await submit();
    expect(screen.getByRole("button", { name: "Signing in…" })).toBeDisabled();
    expect(
      await screen.findByRole("heading", { name: "Workspaces" }),
    ).toBeVisible();
    expect(calls).toBe(1);
  });
  it("rejects a legacy non-UUID return destination without inferring membership", async () => {
    server.use(http.post(url, () => HttpResponse.json(payload())));
    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/w/verified-internal-path"]}>
          <CurrentPath />
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await submit();
    expect(await screen.findByText(/No workspaces yet/)).toBeVisible();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/workspaces");
    expect(screen.queryByText("Workspace overview")).not.toBeInTheDocument();
  });
  it("rejects an external return destination", async () => {
    server.use(http.post(url, () => HttpResponse.json(payload())));
    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/sign-in",
              state: { from: "https://attacker.invalid/" },
            },
          ]}
        >
          <CurrentPath />
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await submit();
    expect(await screen.findByText(/No workspaces yet/)).toBeVisible();
    expect(screen.getByTestId("current-path")).toHaveTextContent("/workspaces");
  });
  it("expires the in-memory session before the access-token deadline", () => {
    vi.useFakeTimers();
    try {
      authSession.establish(
        {
          userId: payload().data.userId,
          accessToken: token,
          expiresAt: Date.now() + 60_000,
        },
        authSession.begin(),
      );
      expect(authSession.getAccessToken()).toBe(token);
      vi.advanceTimersByTime(30_000);
      expect(authSession.getSnapshot().status).toBe("anonymous");
      expect(authSession.getAccessToken()).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
  it("clears local session and query cache on sign-out and reports revocation is unconfirmed", async () => {
    const client = createQueryClient();
    authSession.establish(
      {
        userId: payload().data.userId,
        accessToken: token,
        expiresAt: Date.now() + 600_000,
      },
      authSession.begin(),
    );
    client.setQueryData(["private"], "private data");
    render(
      <QueryClientProvider client={client}>
        <SessionCacheObserver />
        <MemoryRouter initialEntries={["/workspaces"]}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "User account" }));
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Server-side sign-out could not be confirmed",
    );
    expect(client.getQueryData(["private"])).toBeUndefined();
    expect(authSession.getAccessToken()).toBeUndefined();
  });
  it("does not resurrect a signed-out session after a delayed login response", async () => {
    let started = false;
    server.use(
      http.post(url, async () => {
        started = true;
        await delay(80);
        return HttpResponse.json(payload());
      }),
    );
    const attempt = authSession.begin();
    const pending = login(
      { email: "user@example.com", password: "test-password" },
      attempt,
    );
    await waitFor(() => {
      expect(started).toBe(true);
    });
    act(() => {
      authSession.clear();
    });
    expect(await pending).toBe(false);
    expect(authSession.getSnapshot().status).toBe("anonymous");
  });
  it("ignores an old 401 after a new session has been established", async () => {
    let started = false;
    authSession.establish(
      {
        userId: payload().data.userId,
        accessToken: token,
        expiresAt: Date.now() + 600_000,
      },
      authSession.begin(),
    );
    server.use(
      http.get(window.location.origin + "/identity/old-request", async () => {
        started = true;
        await delay(80);
        return HttpResponse.json({}, { status: 401 });
      }),
    );
    const pending = httpClient
      .get("old-request")
      .catch((error: unknown) => error);
    await waitFor(() => {
      expect(started).toBe(true);
    });
    authSession.clear();
    authSession.establish(
      {
        userId: payload().data.userId,
        accessToken: token,
        expiresAt: Date.now() + 600_000,
      },
      authSession.begin(),
    );
    await pending;
    expect(authSession.getSnapshot().status).toBe("authenticated");
  });
  it("clears a rejected bearer session on 401 but not on 403", async () => {
    authSession.establish(
      {
        userId: payload().data.userId,
        accessToken: token,
        expiresAt: Date.now() + 600_000,
      },
      authSession.begin(),
    );
    server.use(
      http.get(`${window.location.origin}/identity/forbidden`, () =>
        HttpResponse.json({}, { status: 403 }),
      ),
      http.get(`${window.location.origin}/identity/unauthorized`, () =>
        HttpResponse.json({}, { status: 401 }),
      ),
    );
    await expect(httpClient.get("forbidden")).rejects.toMatchObject({
      kind: "forbidden",
    });
    expect(authSession.getSnapshot().status).toBe("authenticated");
    await expect(httpClient.get("unauthorized")).rejects.toMatchObject({
      kind: "unauthenticated",
    });
    expect(authSession.getSnapshot().status).toBe("anonymous");
  });
});
