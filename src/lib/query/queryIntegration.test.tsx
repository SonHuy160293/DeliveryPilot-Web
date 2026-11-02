import {
  QueryClientProvider,
  skipToken,
  useQuery,
} from "@tanstack/react-query";
import {
  render,
  screen,
  waitFor,
  act,
  renderHook,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse, delay } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/apiError";
import { createHttpClient } from "@/lib/api/httpClient";
import {
  createQueryClient,
  retryQuery,
  queryRetryDelay,
} from "@/lib/query/queryClient";
import {
  clearSessionCache,
  clearWorkspaceCache,
  workspaceScopeKey,
} from "@/lib/query/queryScope";
import { mockWorkspaces } from "@/mocks/workspaces";
import { fixtureWorkspaceApi } from "@/test/fixtures/workspaceApi";
import { WorkspaceApiHarness } from "@/test/fixtures/WorkspaceApiHarness";
import { server } from "@/test/mocks/server";

const first = mockWorkspaces[0];
if (!first) throw new Error("A workspace fixture is required.");
const base = "https://query.test.invalid/";
const endpoint =
  base + "__fixtures/accounts/account-a/workspaces/workspace-a/records";
const clients: ReturnType<typeof createQueryClient>[] = [];
function setup(scope = { accountId: "account-a", workspaceId: "workspace-a" }) {
  const client = createQueryClient();
  clients.push(client);
  const api = fixtureWorkspaceApi(
    createHttpClient({ baseUrl: base, timeoutMs: 1000 }),
    scope,
  );
  return { client, api };
}
afterEach(() => {
  clients.forEach((client) => {
    client.clear();
  });
  clients.length = 0;
});

describe("query foundation through the test-only workspace API", () => {
  it("renders initial loading, list and detail, then invalidates only the list after creation", async () => {
    const { client, api } = setup();
    const records = [...mockWorkspaces];
    let gets = 0;
    server.use(
      http.get(endpoint, async () => {
        gets++;
        await delay(30);
        return HttpResponse.json(records);
      }),
      http.get(endpoint + "/:id", () => HttpResponse.json(records[0])),
      http.post(endpoint, async ({ request }) => {
        expect(await request.json()).toEqual({
          name: "Test fixture",
          slug: "test-fixture",
        });
        records.push({ ...first, id: "fixture-created", name: "Test fixture" });
        return HttpResponse.json(records.at(-1), { status: 201 });
      }),
    );
    await client.query(api.detail(first.id));
    const other = fixtureWorkspaceApi(
      createHttpClient({ baseUrl: base, timeoutMs: 1000 }),
      { accountId: "account-b", workspaceId: "workspace-a" },
    );
    client.setQueryData(other.keys.list(""), [mockWorkspaces[1]]);
    render(
      <QueryClientProvider client={client}>
        <WorkspaceApiHarness api={api} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(await screen.findByText(first.name)).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Create fixture" }),
    );
    expect(await screen.findByText("Test fixture")).toBeVisible();
    expect(
      await screen.findByText("Fixture created in the mock server only."),
    ).toBeVisible();
    expect(gets).toBe(2);
    expect(client.getQueryState(api.keys.detail(first.id))?.isInvalidated).toBe(
      false,
    );
    expect(client.getQueryState(other.keys.list(""))?.isInvalidated).toBe(
      false,
    );
    expect(client.getQueryData(other.keys.list(""))).toEqual([
      mockWorkspaces[1],
    ]);
  });

  it("shows empty data, failed mutation without retries, and a query error with manual recovery", async () => {
    const { client, api } = setup();
    let creates = 0;
    server.use(
      http.get(endpoint, () => HttpResponse.json({}, { status: 403 })),
      http.post(endpoint, () => {
        creates++;
        return HttpResponse.json({}, { status: 503 });
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <WorkspaceApiHarness api={api} />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have access",
    );
    server.use(http.get(endpoint, () => HttpResponse.json([])));
    await userEvent.click(
      screen.getByRole("button", { name: "Retry loading" }),
    );
    expect(await screen.findByText("No workspaces")).toBeVisible();
    await userEvent.click(
      screen.getByRole("button", { name: "Create fixture" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Fixture creation failed",
    );
    expect(creates).toBe(1);
  });

  it("retains existing data while refetching in the background", async () => {
    const { client, api } = setup();
    client.setQueryData(api.keys.list(""), [...mockWorkspaces]);
    server.use(
      http.get(endpoint, async () => {
        await delay(80);
        return HttpResponse.json([]);
      }),
    );
    render(
      <QueryClientProvider client={client}>
        <WorkspaceApiHarness api={api} />
      </QueryClientProvider>,
    );
    let refresh: Promise<void>;
    act(() => {
      refresh = client.invalidateQueries({ queryKey: api.keys.lists() });
    });
    expect(await screen.findByText("Refreshing workspaces")).toBeVisible();
    expect(screen.getByText(first.name)).toBeVisible();
    await act(async () => {
      await refresh;
    });
    expect(await screen.findByText("No workspaces")).toBeVisible();
  });

  it("keeps cached data visible when a background refresh fails", async () => {
    const { client, api } = setup();
    client.setQueryData(api.keys.list(""), [...mockWorkspaces]);
    server.use(
      http.get(endpoint, () => HttpResponse.json({}, { status: 403 })),
    );
    render(
      <QueryClientProvider client={client}>
        <WorkspaceApiHarness api={api} />
      </QueryClientProvider>,
    );
    await act(async () => {
      await client.invalidateQueries({ queryKey: api.keys.lists() });
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "You do not have access",
    );
    expect(screen.getByText(first.name)).toBeVisible();
    expect(screen.getByRole("button", { name: "Retry loading" })).toBeEnabled();
  });

  it("keys filters, sorting, account and workspace independently and removes only the old workspace", async () => {
    const { client, api } = setup();
    const transport = createHttpClient({ baseUrl: base, timeoutMs: 1000 });
    const secondWorkspace = fixtureWorkspaceApi(transport, {
      accountId: "account-a",
      workspaceId: "workspace-b",
    });
    const secondAccount = fixtureWorkspaceApi(transport, {
      accountId: "account-b",
      workspaceId: "workspace-a",
    });
    server.use(
      http.get(endpoint, ({ request }) => {
        expect(new URL(request.url).searchParams.get("sort")).toBe("name");
        return HttpResponse.json(
          mockWorkspaces.filter((item) =>
            item.name.includes(
              new URL(request.url).searchParams.get("search") ?? "",
            ),
          ),
        );
      }),
    );
    await client.query(api.list("Northstar"));
    await client.query(api.list("Harbor"));
    client.setQueryData(secondWorkspace.keys.list(""), []);
    client.setQueryData(secondAccount.keys.list(""), [mockWorkspaces[1]]);
    expect(client.getQueryData(api.keys.list("Northstar"))).toEqual([
      mockWorkspaces[0],
    ]);
    expect(client.getQueryData(api.keys.list("Harbor"))).toEqual([
      mockWorkspaces[1],
    ]);
    await clearWorkspaceCache(client, {
      accountId: "account-a",
      workspaceId: "workspace-a",
    });
    expect(client.getQueryData(api.keys.list("Northstar"))).toBeUndefined();
    expect(client.getQueryData(secondWorkspace.keys.list(""))).toEqual([]);
    expect(client.getQueryData(secondAccount.keys.list(""))).toEqual([
      mockWorkspaces[1],
    ]);
    expect(() =>
      workspaceScopeKey({ accountId: "", workspaceId: "workspace-a" }),
    ).toThrow();
  });

  it("cancels an in-flight scoped query before clearing a session; late data cannot repopulate it", async () => {
    const { client, api } = setup();
    let started = false;
    let aborted = false;
    server.use(
      http.get(endpoint, async ({ request }) => {
        started = true;
        request.signal.addEventListener("abort", () => {
          aborted = true;
        });
        await delay(80);
        return HttpResponse.json(mockWorkspaces);
      }),
    );
    const request = client.query(api.list()).catch((error: unknown) => error);
    await waitFor(() => {
      expect(started).toBe(true);
    });
    await clearSessionCache(client);
    await request;
    await delay(100);
    expect(aborted).toBe(true);
    expect(client.getQueryCache().getAll()).toEqual([]);
    expect(client.getMutationCache().getAll()).toEqual([]);
  });

  it("supports dependent queries via skipToken without requesting until scope is ready", async () => {
    const { client, api } = setup();
    let calls = 0;
    server.use(
      http.get(endpoint, () => {
        calls++;
        return HttpResponse.json(mockWorkspaces);
      }),
    );
    const { result, rerender } = renderHook(
      ({ ready }) =>
        useQuery({
          ...api.list(),
          queryFn: ready ? api.list().queryFn : skipToken,
        }),
      {
        initialProps: { ready: false },
        wrapper: ({ children }) => (
          <QueryClientProvider client={client}>{children}</QueryClientProvider>
        ),
      },
    );
    expect(result.current.fetchStatus).toBe("idle");
    expect(calls).toBe(0);
    rerender({ ready: true });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expect(calls).toBe(1);
  });

  it("bounds actual GET retries and never retries 401 or POST query functions", async () => {
    const { client, api } = setup();
    client.setDefaultOptions({
      ...client.getDefaultOptions(),
      queries: { ...client.getDefaultOptions().queries, retryDelay: 0 },
    });
    let gets = 0;
    server.use(
      http.get(endpoint, () => {
        gets++;
        return HttpResponse.json({}, { status: 503 });
      }),
    );
    await expect(client.query(api.list())).rejects.toMatchObject({
      kind: "server",
    });
    expect(gets).toBe(3);
    server.use(
      http.get(endpoint, () => {
        gets++;
        return HttpResponse.json({}, { status: 401 });
      }),
    );
    await expect(client.query(api.list("new"))).rejects.toMatchObject({
      kind: "unauthenticated",
    });
    expect(gets).toBe(4);
    let posts = 0;
    server.use(
      http.post(endpoint, () => {
        posts++;
        return HttpResponse.json({}, { status: 503 });
      }),
    );
    const transport = createHttpClient({ baseUrl: base, timeoutMs: 1000 });
    await expect(
      client.query({
        queryKey: ["unsafe-query"],
        queryFn: () => transport.post(new URL(endpoint).pathname.slice(1), {}),
      }),
    ).rejects.toMatchObject({ kind: "server" });
    expect(posts).toBe(1);
  });

  it("honors short Retry-After and leaves long delays to explicit recovery", () => {
    const error = new ApiError("rate-limit", "Try later", {
      method: "GET",
      retryAfterMs: 2000,
    });
    expect(retryQuery(0, error)).toBe(true);
    expect(queryRetryDelay(0, error)).toBe(2000);
    expect(retryQuery(2, error)).toBe(false);
    expect(
      retryQuery(
        0,
        new ApiError("rate-limit", "Try later", {
          method: "GET",
          retryAfterMs: 60_000,
        }),
      ),
    ).toBe(false);
    expect(
      retryQuery(0, new ApiError("cancelled", "Cancelled", { method: "GET" })),
    ).toBe(false);
    expect(retryQuery(0, new Error("Unknown"))).toBe(false);
  });
});
