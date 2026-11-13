import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import {
  firstProject,
  internalProject,
  projectPerson,
} from "@/test/fixtures/projectMock";
import {
  organizationIds as ids,
  organizationFixtures as f,
} from "@/mocks/workspaces";
import { workspaceProjectPath } from "@/lib/routes";
import {
  establishOrganizationSession,
  organizationReadHandlers,
  orgBase,
  failure,
  success,
  paged,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";
import { server } from "@/test/mocks/server";
const id = firstProject.detail.id,
  wid = ids.organization;
const sample = (message: string) =>
  `${message} (sample data — not saved to a server)`;
const originalScroll = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);
beforeEach(() => {
  __resetMocks();
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: () => {},
  });
});
afterEach(() => {
  __resetMocks();
  vi.restoreAllMocks();
  if (originalScroll)
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      originalScroll,
    );
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});
async function openSelect(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  screen.getByRole("combobox", { name }).focus();
  await user.keyboard("{Enter}");
}
function renderPage(projectId = id) {
  return renderOrganizationRoute(workspaceProjectPath(wid, projectId, "team"));
}
async function ready() {
  await screen.findByRole("table", { name: "Project team" }, { timeout: 4000 });
}
async function manage(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(
    within(screen.getByRole("table", { name: "Project team" })).getByRole(
      "button",
      { name: `Manage ${name}` },
    ),
  );
  return within(screen.getByRole("dialog", { name: `Manage ${name}` }));
}
async function participant(key: Parameters<typeof projectPerson>[0]) {
  const value = (await getProjectRepository().listParticipants(wid, id)).find(
    (row) => row.userId === projectPerson(key).id,
  );
  if (!value) throw new Error("Missing test participant");
  return value;
}
describe("project team reads and visibility", () => {
  it.each([
    ["u-mai", true, true],
    ["u-linh", true, false],
    ["u-sofia", false, false],
    ["u-arjun", false, false],
  ] as const)(
    "shows only permitted actions for %s",
    async (persona, manageTeam, admin) => {
      __setMockPersona(persona);
      renderPage();
      await ready();
      expect(
        screen.queryByRole("button", { name: "Invite guest" }) !== null,
      ).toBe(manageTeam);
      expect(
        screen.queryByRole("button", { name: "Add team member" }) !== null,
      ).toBe(manageTeam);
      expect(screen.queryByRole("button", { name: "Change" }) !== null).toBe(
        admin,
      );
      if (manageTeam) {
        const user = userEvent.setup(),
          dialog = await manage(user, "Arjun Mehta");
        expect(
          dialog.queryByRole("button", { name: "Make project admin" }) !== null,
        ).toBe(admin);
      } else
        expect(
          screen.queryByRole("button", { name: /^Manage / }),
        ).not.toBeInTheDocument();
      expect(screen.getByText(/^Sample data\./)).toBeInTheDocument();
    },
  );
  it("keeps the Viewer team read-only", async () => {
    renderPage(internalProject.detail.id);
    await ready();
    expect(
      screen.queryByRole("button", {
        name: /^Manage |Add team member|Invite guest/,
      }),
    ).not.toBeInTheDocument();
  });
  it("shows loading, retries an actual repository error, and excludes removed participants", async () => {
    __setMockFailure("projects.listParticipants", "server");
    renderPage();
    expect(
      await screen.findByText("Loading Project team", {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    const retry = await screen.findByRole(
      "button",
      { name: "Retry loading team" },
      { timeout: 4000 },
    );
    __setMockFailure("projects.listParticipants", null);
    await userEvent.click(retry);
    await ready();
    expect(
      within(screen.getByRole("table", { name: "Project team" })).queryByText(
        "Oskar Lind",
      ),
    ).not.toBeInTheDocument();
  });
  it("disables Add and explains a denied existing workspace members read", async () => {
    server.use(http.get(`${orgBase}/members`, () => failure(403, "Denied")));
    renderPage();
    await ready();
    expect(
      screen.getByRole("button", { name: "Add team member" }),
    ).toBeDisabled();
    expect(
      screen.getByText(
        "You don't have permission to view workspace members. Ask a workspace administrator to add team members.",
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Invite guest" })).toBeEnabled();
  });
  it("retries a members read failure and pages active options without fixture fallbacks", async () => {
    let failed = true;
    const person = projectPerson("u-daniel");
    server.use(
      http.get(`${orgBase}/members`, ({ request }) =>
        failed
          ? failure(503, "Unavailable")
          : success(
              paged(
                new URL(request.url).searchParams.has("cursor")
                  ? [
                      {
                        ...f.otherMember,
                        userId: person.id,
                        displayName: person.displayName,
                        primaryEmail: person.primaryEmail,
                      },
                    ]
                  : [{ ...f.otherMember, userId: projectPerson("u-linh").id }],
                new URL(request.url).searchParams.has("cursor") ? null : "next",
              ),
            ),
      ),
    );
    renderPage();
    await ready();
    failed = false;
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Retry loading workspace members" }),
    );
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Add team member" }),
      ).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "Add team member" }));
    await user.click(
      within(screen.getByRole("dialog", { name: "Add team member" })).getByRole(
        "button",
        { name: "Load more" },
      ),
    );
    await openSelect(user, "Member");
    expect(
      await screen.findByRole("option", {
        name: new RegExp(person.displayName),
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("option", { name: /Linh/ }),
    ).not.toBeInTheDocument();
  });
  it("keeps guest roles free of Project admin and pending roles immutable", async () => {
    __setMockPersona("u-mai");
    renderPage();
    await ready();
    const user = userEvent.setup();
    const dialog = await manage(user, "Tomasz Nowak");
    expect(
      dialog.queryByRole("button", { name: /project admin/ }),
    ).not.toBeInTheDocument();
    await user.click(dialog.getByRole("button", { name: "Change roles" }));
    expect(
      within(
        screen.getByRole("dialog", { name: "Change roles: Tomasz Nowak" }),
      ).queryByRole("checkbox", { name: "Project admin" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}{Escape}");
    await user.click(screen.getByRole("button", { name: "Invite guest" }));
    await openSelect(user, "Role");
    expect(
      screen.queryByRole("option", { name: "Project admin" }),
    ).not.toBeInTheDocument();
    await user.keyboard("{Escape}{Escape}");
    expect(
      screen.getByText(
        "To offer a different role, cancel and send a new invitation.",
      ),
    ).toBeVisible();
    expect(
      within(
        screen.getByRole("table", { name: "Pending guest invitations" }),
      ).queryByRole("combobox"),
    ).not.toBeInTheDocument();
  });
  it("reaches a Manage dialog from its mobile card using the keyboard", async () => {
    renderPage();
    await ready();
    const user = userEvent.setup();
    const trigger = within(
      screen.getByRole("list", { name: "Project team" }),
    ).getByRole("button", { name: "Manage Sofia Reyes" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("dialog", { name: "Manage Sofia Reyes" }),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
});
describe("team action validation and domain errors", () => {
  it.each(["duplicate", "not a member"] as const)(
    "shows the exact add-participant %s error",
    async (kind) => {
      const person = projectPerson(
        kind === "duplicate" ? "u-daniel" : "u-oskar",
      );
      server.use(
        http.get(`${orgBase}/members`, () =>
          success(
            paged([
              {
                ...f.otherMember,
                userId: person.id,
                displayName: person.displayName,
                primaryEmail: person.primaryEmail,
              },
            ]),
          ),
        ),
      );
      renderPage();
      await ready();
      const user = userEvent.setup();
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Add team member" }),
        ).toBeEnabled();
      });
      await user.click(screen.getByRole("button", { name: "Add team member" }));
      await openSelect(user, "Member");
      await user.click(
        screen.getByRole("option", { name: new RegExp(person.displayName) }),
      );
      const form = within(
        screen.getByRole("dialog", { name: "Add team member" }),
      );
      await user.click(form.getByRole("checkbox", { name: "Viewer" }));
      if (kind === "duplicate")
        await act(async () => {
          await getProjectRepository().addParticipant(wid, id, {
            userId: person.id,
            roles: ["Viewer"],
          });
        });
      await user.click(form.getByRole("button", { name: "Add team member" }));
      expect(
        await form.findByText(
          kind === "duplicate"
            ? "This person is already on the team."
            : "This person isn't an active member of the workspace.",
        ),
      ).toBeVisible();
    },
  );
  it("blocks removing the final administrator with the exact message", async () => {
    __setMockPersona("u-mai");
    renderPage();
    await ready();
    const user = userEvent.setup(),
      dialog = await manage(user, "Mai Tran");
    await user.click(
      dialog.getByRole("button", { name: "Remove project admin" }),
    );
    const form = within(
      screen.getByRole("dialog", { name: "Remove project admin: Mai Tran" }),
    );
    await user.click(form.getByRole("checkbox", { name: "Viewer" }));
    await user.click(form.getByRole("button", { name: "Save roles" }));
    expect(
      await screen.findByText(
        "A project needs at least one administrator. Make someone else an administrator first.",
      ),
    ).toBeVisible();
  });
  it("validates an empty role checklist, invalid email and duplicate invite", async () => {
    renderPage();
    await ready();
    const user = userEvent.setup(),
      dialog = await manage(user, "Sofia Reyes");
    await user.click(dialog.getByRole("button", { name: "Change roles" }));
    const form = within(
      screen.getByRole("dialog", { name: "Change roles: Sofia Reyes" }),
    );
    await user.click(form.getByRole("checkbox", { name: "BA" }));
    await user.click(form.getByRole("button", { name: "Save roles" }));
    expect(
      await screen.findByText(
        "Choose at least one role. To remove the person, use Remove from project.",
      ),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Invite guest" }));
    const invite = within(screen.getByRole("dialog", { name: "Invite guest" }));
    await user.type(invite.getByLabelText("Email"), "bad");
    await user.tab();
    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeVisible();
    await user.clear(invite.getByLabelText("Email"));
    await user.type(
      invite.getByLabelText("Email"),
      "grace.liu@larkspur.example",
    );
    await user.click(invite.getByRole("button", { name: "Invite guest" }));
    expect(
      await screen.findByText("This person already has a pending invitation."),
    ).toBeVisible();
  });
  it("shows the exact workspace-member invitation and rate-limit errors", async () => {
    renderPage();
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Invite guest" }));
    const form = within(screen.getByRole("dialog", { name: "Invite guest" }));
    await user.type(
      form.getByLabelText("Email"),
      projectPerson("u-daniel").primaryEmail,
    );
    await user.click(form.getByRole("button", { name: "Invite guest" }));
    expect(
      await screen.findByText(
        "This person is a workspace member. Add them as a team member instead.",
      ),
    ).toBeVisible();
    __setMockFailure("projects.inviteGuest", "rate-limit");
    await user.clear(form.getByLabelText("Email"));
    await user.type(form.getByLabelText("Email"), "new@client.example");
    await user.click(form.getByRole("button", { name: "Invite guest" }));
    expect(
      await screen.findByText(
        "You've sent several invitations recently. Try again in 1 minute.",
      ),
    ).toBeVisible();
    expect(form.getByRole("button", { name: "Invite guest" })).toBeDisabled();
  });
});
describe("team writes", () => {
  it.each([
    "roles",
    "make admin",
    "remove admin",
    "remove member",
    "revoke guest",
    "assign PO",
    "remove PO",
    "invite",
    "resend",
    "cancel",
    "add",
  ] as const)(
    "handles failure then success for %s",
    async (action) => {
      __setMockPersona("u-mai");
      const repo = getProjectRepository();
      if (action === "remove admin") {
        const target = await participant("u-arjun");
        await repo.changeRoles(wid, id, target.id, {
          roles: [...target.roles, "ProjectAdministrator"],
          expectedVersion: target.version,
        });
      }
      if (action === "assign PO") {
        const project = await repo.get(wid, id);
        await repo.assignClientPo(wid, id, null, project.version);
      }
      if (action === "add") {
        const person = projectPerson("u-daniel");
        server.use(
          http.get(`${orgBase}/members`, () =>
            success(
              paged([
                {
                  ...f.otherMember,
                  userId: person.id,
                  displayName: person.displayName,
                  primaryEmail: person.primaryEmail,
                },
              ]),
            ),
          ),
        );
      }
      renderPage();
      await ready();
      const user = userEvent.setup();
      let operation = "",
        label = "",
        message = "";
      if (
        [
          "roles",
          "make admin",
          "remove admin",
          "remove member",
          "revoke guest",
        ].includes(action)
      ) {
        const name =
          action === "revoke guest"
            ? "Tomasz Nowak"
            : action === "make admin" || action === "remove admin"
              ? "Arjun Mehta"
              : "Sofia Reyes";
        const outer = await manage(user, name);
        const trigger =
          action === "roles"
            ? "Change roles"
            : action === "make admin"
              ? "Make project admin"
              : action === "remove admin"
                ? "Remove project admin"
                : action === "remove member"
                  ? "Remove from project"
                  : "Revoke guest access";
        await user.click(outer.getByRole("button", { name: trigger }));
        label = ["roles", "remove admin"].includes(action)
          ? "Save roles"
          : trigger;
        operation = ["roles", "make admin", "remove admin"].includes(action)
          ? "projects.changeRoles"
          : "projects.endParticipation";
        message =
          operation === "projects.changeRoles"
            ? "Roles updated."
            : action === "revoke guest"
              ? "Guest access revoked."
              : "Removed from the project.";
        if (action === "roles")
          await user.click(screen.getByRole("checkbox", { name: "Developer" }));
        if (action === "revoke guest")
          expect(
            screen.getByText(
              "Tomasz Nowak is the client Product Owner. Revoking also removes that assignment.",
            ),
          ).toBeVisible();
      } else if (action === "assign PO" || action === "remove PO") {
        label =
          action === "assign PO" ? "Assign client PO" : "Remove client PO";
        operation = "projects.assignClientPo";
        message =
          action === "assign PO"
            ? "Tomasz Nowak is now the client Product Owner."
            : "Client Product Owner removed.";
        await user.click(screen.getByRole("button", { name: label }));
        if (action === "assign PO") {
          await openSelect(user, "Guest");
          await user.click(
            screen.getByRole("option", { name: /Tomasz Nowak/ }),
          );
        }
      } else if (action === "invite") {
        operation = "projects.inviteGuest";
        label = "Invite guest";
        message =
          "Invitation sent to new@client.example. It expires in 7 days.";
        await user.click(screen.getByRole("button", { name: label }));
        await user.type(screen.getByLabelText("Email"), "new@client.example");
      } else if (action === "add") {
        operation = "projects.addParticipant";
        label = "Add team member";
        message = "Daniel Okafor added to the team.";
        await waitFor(() => {
          expect(screen.getByRole("button", { name: label })).toBeEnabled();
        });
        await user.click(screen.getByRole("button", { name: label }));
        await openSelect(user, "Member");
        await user.click(screen.getByRole("option", { name: /Daniel Okafor/ }));
        await user.click(screen.getByRole("checkbox", { name: "Viewer" }));
      } else {
        operation =
          action === "resend"
            ? "projects.resendInvitation"
            : "projects.cancelInvitation";
        label = action === "resend" ? "Resend" : "Cancel invitation";
        message =
          action === "resend" ? "Invitation resent." : "Invitation cancelled.";
        await user.click(
          within(
            await screen.findByRole("table", {
              name: "Pending guest invitations",
            }),
          ).getByRole("button", {
            name: action === "cancel" ? "Cancel" : label,
          }),
        );
      }
      __setMockFailure(operation, "server");
      const form = within(
        screen.getAllByRole("dialog").at(-1) ?? document.body,
      );
      await user.click(form.getByRole("button", { name: label }));
      expect(await form.findByRole("alert")).toHaveTextContent(
        /outcome is unknown/,
      );
      expect(screen.queryByText(sample(message))).not.toBeInTheDocument();
      __setMockFailure(operation, null);
      await user.click(form.getByRole("button", { name: label }));
      expect(
        await screen.findByText(sample(message), {}, { timeout: 4000 }),
      ).toBeInTheDocument();
      if (action === "revoke guest" || action === "remove PO")
        expect(
          screen.getByText("No client Product Owner assigned."),
        ).toBeVisible();
      if (action === "cancel")
        expect(screen.getByText("No pending invitations.")).toBeVisible();
    },
    12000,
  );
  it("reloads a conflicting participant version before retrying", async () => {
    renderPage();
    await ready();
    const user = userEvent.setup(),
      outer = await manage(user, "Sofia Reyes");
    await user.click(outer.getByRole("button", { name: "Change roles" }));
    const form = within(
      screen.getByRole("dialog", { name: "Change roles: Sofia Reyes" }),
    );
    const target = await participant("u-sofia");
    await act(async () => {
      await getProjectRepository().changeRoles(wid, id, target.id, {
        roles: ["Viewer"],
        expectedVersion: target.version,
      });
    });
    await user.click(form.getByRole("checkbox", { name: "Developer" }));
    await user.click(form.getByRole("button", { name: "Save roles" }));
    expect(await form.findByRole("alert")).toHaveTextContent(
      "Someone else changed this. Reload to see the latest version.",
    );
    await user.click(form.getByRole("button", { name: "Reload" }));
    await waitFor(() => {
      expect(form.getByRole("checkbox", { name: "Viewer" })).toBeChecked();
    });
    await user.click(form.getByRole("checkbox", { name: "Developer" }));
    await user.click(form.getByRole("button", { name: "Save roles" }));
    expect(
      await screen.findByText(sample("Roles updated."), {}, { timeout: 4000 }),
    ).toBeVisible();
  }, 10000);
});
