import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "@/test/mocks/server";
import { authSession } from "@/lib/api/authSession";

// jsdom has no layout observer. This enables Radix semantics, not layout assertions.
globalThis.ResizeObserver = class implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});
afterAll(() => {
  server.close();
});

afterEach(() => {
  cleanup();
  authSession.clear();
  server.resetHandlers();
  window.localStorage.clear();
  document.documentElement.classList.remove("dark");
});
