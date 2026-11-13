import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/lib/routes";
vi.mock("react-dom/client", () => ({ createRoot: vi.fn() }));
describe("project invitation bootstrap", () => {
  it("removes the real fragment before createRoot and keeps the proof out of all React props", async () => {
    const previous = window.location.pathname + window.location.search,
      proof = "bootstrap-ephemeral-proof",
      root = document.createElement("div");
    root.id = "root";
    document.body.append(root);
    window.history.replaceState(
      {},
      "",
      `${ROUTES.joinProject}#invitationId=019a4200-0000-7000-8000-000000000001&proof=${proof}`,
    );
    const render = vi.fn();
    vi.mocked(createRoot).mockImplementation(() => {
      expect(window.location.hash).toBe("");
      return { render, unmount: vi.fn() };
    });
    try {
      await import("@/main");
      expect(render).toHaveBeenCalledOnce();
      expect(JSON.stringify(render.mock.calls)).not.toContain(proof);
      expect(window.location.hash).toBe("");
    } finally {
      root.remove();
      window.history.replaceState({}, "", previous);
    }
  });
});
