import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createProjectRecipientLifecycle } from "@/features/projects/guest-invitations/recipient/flowLifecycle";
import { establishOrganizationSession } from "@/test/fixtures/organizationApi";
import { authSession } from "@/lib/api/authSession";
import { organizationIds } from "@/mocks/workspaces";
describe("project recipient lifecycle ownership", () => {
  it("binds the first same-tab sign-in and erases payloads on a later account change", () => {
    const payload = Symbol("ephemeral"),
      flow = createProjectRecipientLifecycle(payload);
    const owner = establishOrganizationSession();
    flow.retire();
    expect(flow.bind(owner)).toBe(payload);
    establishOrganizationSession(organizationIds.otherUser);
    flow.retire();
    expect(flow.get()).toBeUndefined();
  });
  it("clears on subject generation changes and explicit completion", () => {
    establishOrganizationSession();
    const flow = createProjectRecipientLifecycle(Symbol("ephemeral"));
    act(() => {
      authSession.clear();
    });
    expect(flow.get()).toBeUndefined();
    const fresh = createProjectRecipientLifecycle(Symbol("fresh"));
    fresh.clear();
    expect(fresh.get()).toBeUndefined();
    expect(JSON.stringify(fresh)).toBe("{}");
  });
});
