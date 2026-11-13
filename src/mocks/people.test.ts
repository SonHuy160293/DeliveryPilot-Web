import users from "@/../docs/ui-plan/05-mock-data/users.json";
import workspaces from "@/../docs/ui-plan/05-mock-data/workspaces.json";
import { expect, it } from "vitest";
import { MOCK_PEOPLE, MOCK_WORKSPACES } from "@/mocks/people";

it("copies the approved people and workspace records without changing their IDs", () => {
  expect(users).toMatchObject({ users: MOCK_PEOPLE });
  expect(workspaces).toMatchObject({ workspaces: MOCK_WORKSPACES });
  expect(MOCK_PEOPLE).toHaveLength(9);
  expect(MOCK_WORKSPACES).toHaveLength(2);
});
