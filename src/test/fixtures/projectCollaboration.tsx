import { screen, within } from "@testing-library/react";
import { organizationIds as ids } from "@/mocks/workspaces";
import { firstProject } from "@/test/fixtures/projectMock";
import {
  establishOrganizationSession,
  organizationReadHandlers,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";
import { server } from "@/test/mocks/server";
import { workspaceProjectPath } from "@/lib/routes";
import { __resetMocks } from "@/mocks/mockRuntime";
export const collaborationWorkspace = ids.organization;
export const collaborationProject = firstProject.detail.id;
export function prepareCollaboration() {
  __resetMocks();
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
}
export function renderCollaboration(
  tab: "sharing" | "stakeholders" | "overview",
  id = collaborationProject,
) {
  return renderOrganizationRoute(
    workspaceProjectPath(collaborationWorkspace, id, tab),
  );
}
export async function collaborationTable(name: string) {
  return within(await screen.findByRole("table", { name }, { timeout: 6000 }));
}
