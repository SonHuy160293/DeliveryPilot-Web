import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/apiError";
import { normalizeApiError } from "@/lib/api/errorNormalizer";
import {
  __resetMocks,
  __setMockFailure,
  __setMockPersona,
  checkMockFailure,
  delay,
  resolveMockPersona,
  throwMockFailure,
} from "@/mocks/mockRuntime";

afterEach(() => {
  vi.unstubAllEnvs();
  __resetMocks();
  vi.useRealTimers();
});
describe("mock latency and personas", () => {
  it("defaults to 400 ms without a real wait", async () => {
    vi.useFakeTimers();
    let finished = false;
    const pending = delay().then(() => {
      finished = true;
    });
    await vi.advanceTimersByTimeAsync(399);
    expect(finished).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(finished).toBe(true);
  });
  it("supports an explicit repository delay", async () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const pending = delay(12).then(done);
    await vi.advanceTimersByTimeAsync(12);
    await pending;
    expect(done).toHaveBeenCalledOnce();
  });
  it("uses the documented workspace and portal personas independently", () => {
    expect(resolveMockPersona().key).toBe("u-linh");
    expect(resolveMockPersona("portal").key).toBe("u-tomasz");
    __setMockPersona("u-mai");
    expect(resolveMockPersona().key).toBe("u-mai");
    expect(resolveMockPersona("portal").key).toBe("u-mai");
    __resetMocks();
    expect(resolveMockPersona("portal").key).toBe("u-tomasz");
  });
  it("ignores URL persona and failure parameters", () => {
    const previous = window.location.href;
    try {
      window.history.replaceState({}, "", "?persona=u-mai&failure=forbidden");
      expect(resolveMockPersona().key).toBe("u-linh");
      expect(() => {
        checkMockFailure("list");
      }).not.toThrow();
    } finally {
      window.history.replaceState({}, "", previous);
    }
  });
  it("rejects test controls outside test mode", () => {
    vi.stubEnv("MODE", "production");
    expect(() => {
      __setMockPersona("u-mai");
    }).toThrow("only in tests");
    expect(() => {
      __setMockFailure("list", "forbidden");
    }).toThrow("only in tests");
    expect(__resetMocks).toThrow("only in tests");
  });
});
describe("mock failures match transport outcomes", () => {
  it.each([
    [403, "forbidden"],
    [404, "not-found"],
    [409, "conflict"],
    [422, "validation"],
    [429, "rate-limit"],
    [500, "server"],
    [503, "server"],
  ] as const)("maps status %s to %s", (status, kind) => {
    const transport = normalizeApiError(
      new AxiosError<unknown>(
        "Synthetic error",
        undefined,
        undefined,
        undefined,
        {
          status,
          statusText: "",
          data: {},
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      ),
    );
    expect(transport.kind).toBe(kind);
    let failure: unknown;
    try {
      throwMockFailure(kind, { status });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(ApiError);
    if (!(failure instanceof ApiError))
      throw new Error("Expected an ApiError.");
    expect(failure.kind).toBe(transport.kind);
    expect(failure.details.status).toBe(status);
  });
  it("preserves validation field errors and rate-limit metadata", () => {
    expect(() => {
      throwMockFailure("validation", {
        fieldErrors: { name: ["Check this value."] },
      });
    }).toThrow(
      expect.objectContaining({
        kind: "validation",
        details: { status: 422, fieldErrors: { name: ["Check this value."] } },
      }),
    );
    expect(() => {
      throwMockFailure("rate-limit");
    }).toThrow(
      expect.objectContaining({
        details: { status: 429, retryAfterMs: 60_000 },
      }),
    );
  });
  it("scopes an injected failure to its operation and resets it", () => {
    __setMockFailure("projects.list", "forbidden");
    expect(() => {
      checkMockFailure("projects.list");
    }).toThrow(ApiError);
    expect(() => {
      checkMockFailure("projects.get");
    }).not.toThrow();
    __setMockFailure("projects.list", null);
    expect(() => {
      checkMockFailure("projects.list");
    }).not.toThrow();
    __setMockFailure("projects.get", "not-found");
    __resetMocks();
    expect(() => {
      checkMockFailure("projects.get");
    }).not.toThrow();
  });
});
