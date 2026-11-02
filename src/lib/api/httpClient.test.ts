import { http, HttpResponse, delay } from "msw";
import { describe, expect, it, vi } from "vitest";
import { createHttpClient } from "@/lib/api/httpClient";
import { ApiError } from "@/lib/api/apiError";
import {
  normalizeApiError,
  retryAfterMilliseconds,
} from "@/lib/api/errorNormalizer";
import { readApiConfig } from "@/lib/api/config";
import { server } from "@/test/mocks/server";

const base = "https://api.test.invalid/identity/";
const makeClient = (timeoutMs = 1000) =>
  createHttpClient({ baseUrl: base, timeoutMs });

describe("HTTP foundation", () => {
  it("sends JSON headers and returns JSON/204 without wrapping successes", async () => {
    // MSW's network-frame reconstruction does not retain Fetch credentials.
    // Assert the actual Request handed to fetch before that reconstruction.
    const fetchRequest = vi.spyOn(globalThis, "fetch");
    server.use(
      http.post(base + "echo", async ({ request }) => {
        expect(request.headers.get("accept")).toBe("application/json");
        expect(request.headers.get("content-type")).toContain(
          "application/json",
        );
        return HttpResponse.json(await request.json());
      }),
      http.get(base + "empty", () => new HttpResponse(null, { status: 204 })),
    );
    expect(
      (await makeClient().post<unknown>("echo", { name: "Demo" })).data,
    ).toEqual({ name: "Demo" });
    expect(fetchRequest.mock.calls[0]?.[0]).toMatchObject({
      credentials: "omit",
      redirect: "error",
    });
    expect((await makeClient().get<unknown>("empty")).data).toBeUndefined();
  });

  it.each([
    [400, "bad-request"],
    [401, "unauthenticated"],
    [403, "forbidden"],
    [404, "not-found"],
    [409, "conflict"],
    [422, "validation"],
    [429, "rate-limit"],
    [500, "server"],
    [503, "server"],
    [405, "http"],
  ])(
    "normalizes HTTP %i without leaking the response/config",
    async (status, kind) => {
      server.use(
        http.get(base + "failure", () =>
          HttpResponse.json(
            {
              title: "secret-token",
              detail: "database password",
              traceId: "trace-123",
            },
            { status },
          ),
        ),
      );
      const error: unknown = await makeClient()
        .get("failure")
        .catch((value: unknown) => value);
      expect(error).toBeInstanceOf(ApiError);
      if (!(error instanceof ApiError))
        throw new Error("Expected normalized error");
      expect(error.kind).toBe(kind);
      expect(error.details.status).toBe(status);
      expect(error.details.traceId).toBe("trace-123");
      expect(JSON.stringify(error)).not.toMatch(
        /secret-token|database password|Authorization|config|response/,
      );
    },
  );

  it("supports both ProblemDetails and the actual .NET error envelope", async () => {
    server.use(
      http.get(base + "problem", () =>
        HttpResponse.json(
          {
            errors: { email: ["Enter a valid email."] },
            title: "Do not display raw titles",
          },
          { status: 422 },
        ),
      ),
      http.get(base + "envelope", () =>
        HttpResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "Validation.Failure",
              errors: { displayName: ["Enter a name."] },
              traceId: "trace-456",
            },
          },
          { status: 400 },
        ),
      ),
    );
    await expect(makeClient().get("problem")).rejects.toMatchObject({
      details: { fieldErrors: { email: ["Enter a valid email."] } },
    });
    await expect(makeClient().get("envelope")).rejects.toMatchObject({
      details: {
        code: "Validation.Failure",
        traceId: "trace-456",
        fieldErrors: { displayName: ["Enter a name."] },
      },
    });
  });

  it("preserves response correlation and Retry-After without inventing request headers", async () => {
    server.use(
      http.get(base + "limit", ({ request }) => {
        expect(request.headers.has("x-workspace-id")).toBe(false);
        expect(request.headers.has("x-correlation-id")).toBe(false);
        return HttpResponse.json(
          {},
          {
            status: 429,
            headers: { "Retry-After": "2", "X-Correlation-Id": "server-trace" },
          },
        );
      }),
    );
    await expect(makeClient().get("limit")).rejects.toMatchObject({
      details: { retryAfterMs: 2000, traceId: "server-trace" },
    });
    expect(retryAfterMilliseconds("Thu, 01 Jan 1970 00:00:03 GMT", 1000)).toBe(
      2000,
    );
    expect(retryAfterMilliseconds("not a date")).toBeUndefined();
  });

  it("distinguishes network failure, timeout and cancellation", async () => {
    server.use(
      http.get(base + "network", () => HttpResponse.error()),
      http.get(base + "slow", async () => {
        await delay(150);
        return HttpResponse.json({});
      }),
    );
    await expect(makeClient().get("network")).rejects.toMatchObject({
      kind: "network",
    });
    await expect(makeClient(20).get("slow")).rejects.toMatchObject({
      kind: "timeout",
    });
    const controller = new AbortController();
    const result = makeClient().get("slow", { signal: controller.signal });
    controller.abort();
    await expect(result).rejects.toMatchObject({ kind: "cancelled" });
  });

  it("rejects malformed JSON as a protocol failure without retaining the body", async () => {
    server.use(
      http.get(
        base + "malformed",
        () =>
          new HttpResponse('{"private":broken', {
            headers: { "Content-Type": "application/json" },
          }),
      ),
    );
    await expect(makeClient().get("malformed")).rejects.toMatchObject({
      kind: "protocol",
    });
  });

  it("uses only the explicit bearer supplier and never refreshes or retries 401", async () => {
    let count = 0;
    server.use(
      http.get(base + "private", ({ request }) => {
        count++;
        expect(request.headers.get("authorization")).toBe("Bearer memory-only");
        return HttpResponse.json({}, { status: 401 });
      }),
    );
    const client = createHttpClient(
      { baseUrl: base, timeoutMs: 1000 },
      { getAccessToken: () => "memory-only" },
    );
    await expect(client.get("private")).rejects.toMatchObject({
      kind: "unauthenticated",
    });
    expect(count).toBe(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it("strips caller Authorization when no approved session supplier exists", async () => {
    server.use(
      http.get(base + "public", ({ request }) => {
        expect(request.headers.has("authorization")).toBe(false);
        return HttpResponse.json({});
      }),
    );
    await makeClient().get("public", {
      headers: { Authorization: "Bearer accidental" },
    });
  });

  it.each([
    "https://unrelated.invalid/path",
    "//unrelated.invalid/path",
    "/escape",
    "../outside",
    "%2e%2e/outside",
    "nested%2f..%2fescape",
    "path#fragment",
    "\\outside",
  ])("rejects endpoint escape %s before acquiring credentials", async (url) => {
    let reads = 0;
    const client = createHttpClient(
      { baseUrl: base, timeoutMs: 1000 },
      {
        getAccessToken: () => {
          reads++;
          return "sensitive";
        },
      },
    );
    await expect(client.get(url)).rejects.toMatchObject({
      kind: "configuration",
    });
    expect(reads).toBe(0);
  });

  it("rejects base/credential overrides and fails closed without configuration", async () => {
    await expect(
      makeClient().get("public", { baseURL: "https://unrelated.invalid/" }),
    ).rejects.toMatchObject({ kind: "configuration" });
    await expect(
      makeClient().get("public", { withCredentials: true }),
    ).rejects.toMatchObject({ kind: "configuration" });
    await expect(
      createHttpClient({ timeoutMs: 1000 }).get("public"),
    ).rejects.toMatchObject({ kind: "configuration" });
    expect(() =>
      createHttpClient({
        baseUrl: "https://user:password@api.invalid/",
        timeoutMs: 1000,
      }),
    ).toThrow(ApiError);
  });

  it("does not follow a redirect carrying a POST body to another origin", async () => {
    let leaked = false;
    server.use(
      http.post(
        base + "redirect",
        () =>
          new HttpResponse(null, {
            status: 307,
            headers: { Location: "https://unrelated.invalid/steal" },
          }),
      ),
      http.post("https://unrelated.invalid/steal", () => {
        leaked = true;
        return HttpResponse.json({});
      }),
    );
    await expect(
      makeClient().post("redirect", { password: "never-send-onward" }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(leaked).toBe(false);
  });

  it("validates runtime timeout settings and normalizes unknown thrown values", () => {
    expect(readApiConfig({})).toEqual({
      baseUrl: undefined,
      timeoutMs: 15_000,
    });
    expect(() => readApiConfig({ VITE_API_TIMEOUT_MS: "0" })).toThrow(ApiError);
    expect(normalizeApiError(new Error("raw secret")).message).not.toContain(
      "raw secret",
    );
  });
});
