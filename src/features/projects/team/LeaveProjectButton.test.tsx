import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LeaveProjectButton } from "@/features/projects/team/LeaveProjectButton";
import { createQueryClient } from "@/lib/query/queryClient";
import { ROUTES, workspaceProjectPath } from "@/lib/routes";
import { establishOrganizationSession } from "@/test/fixtures/organizationApi";
import { authSession } from "@/lib/api/authSession";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import {
  firstProject,
  projectWorkspace as wid,
} from "@/test/fixtures/projectMock";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
beforeEach(() => {
  __resetMocks();
  establishOrganizationSession();
});
afterEach(() => {
  __resetMocks();
});
describe("LeaveProjectButton", () => {
  it("confirms the consequence, handles failure, clears guest caches and navigates to My projects", async () => {
    const id = firstProject.detail.id;
    await getProjectRepository().get(wid, id);
    __setMockPersona("u-tomasz");
    const session = authSession.getSnapshot();
    if (session.status !== "authenticated") throw new Error("Missing session");
    const client = createQueryClient(),
      key = ["account", session.userId, "portal", "project", id];
    client.setQueryData(key, firstProject.detail);
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[workspaceProjectPath(wid, id)]}>
          <Routes>
            <Route
              path={ROUTES.workspaceProject}
              element={
                <LeaveProjectButton
                  scope={{
                    accountId: session.userId,
                    generation: authSession.version(),
                  }}
                  projectId={id}
                  projectName={firstProject.detail.name}
                />
              }
            />
            <Route path={ROUTES.portal} element={<h1>My projects</h1>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Leave project" }));
    const dialog = within(
      screen.getByRole("dialog", {
        name: `Leave project: ${firstProject.detail.name}`,
      }),
    );
    expect(
      dialog.getByText("You will lose access to this project immediately."),
    ).toBeVisible();
    __setMockFailure("projects.leave", "server");
    await user.click(dialog.getByRole("button", { name: "Leave project" }));
    expect(await dialog.findByRole("alert")).toHaveTextContent(
      /outcome is unknown/,
    );
    expect(client.getQueryData(key)).toBeDefined();
    __setMockFailure("projects.leave", null);
    await user.click(dialog.getByRole("button", { name: "Leave project" }));
    expect(
      await screen.findByRole("heading", { name: "My projects" }),
    ).toBeVisible();
    expect(client.getQueryData(key)).toBeUndefined();
    await expect(
      getProjectRepository().listParticipants(wid, id),
    ).rejects.toMatchObject({ kind: "not-found" });
  });
});
