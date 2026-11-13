import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EngagementLocationProbe } from "@/test/fixtures/EngagementLocationProbe";
import { engagementFixtures } from "@/mocks/engagements";
import { organizationIds } from "@/mocks/workspaces";
import { workspaceEngagementPath } from "@/lib/routes";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";
import type { EngagementDetail } from "@/features/engagements/api/types";

function fixture(index: number): EngagementDetail {
  const row = engagementFixtures.items[index];
  if (!row) throw new Error("Missing engagement fixture");
  return row;
}
export const detailFixture = fixture(0);
export const closedFixture = fixture(2);
export const detailWorkspaceId = organizationIds.organization;
export function renderDetail(tab = "details", id = detailFixture.id) {
  return renderOrganizationRoute(
    `${workspaceEngagementPath(detailWorkspaceId, id)}?tab=${tab}`,
    undefined,
    <EngagementLocationProbe />,
  );
}
export async function detailReady(name = detailFixture.clientDisplayName) {
  await screen.findByRole("heading", { level: 1, name });
  await screen.findByRole("tablist", { name: "Engagement sections" });
}
export const milestoneTable = () =>
  within(screen.getByRole("table", { name: "Milestones" }));
export const milestoneRow = () =>
  within(milestoneTable().getByRole("row", { name: /Member app beta/ }));
export async function openDetailAction(label: string, inRow = false) {
  const user = userEvent.setup();
  await detailReady();
  const target = inRow ? milestoneRow() : screen;
  await user.click(target.getByRole("button", { name: label }));
  return { user, dialog: within(screen.getByRole("dialog")) };
}
