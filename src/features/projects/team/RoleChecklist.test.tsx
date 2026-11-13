import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RoleChecklist } from "@/features/projects/team/RoleChecklist";
import type { ProjectRoleCode } from "@/features/projects/api/types";
function Harness({
  guest = false,
  administrator = true,
}: {
  guest?: boolean;
  administrator?: boolean;
}) {
  const [roles, setRoles] = useState<ProjectRoleCode[]>([]);
  return (
    <RoleChecklist
      value={roles}
      onChange={setRoles}
      allowAdministrator={administrator}
      forGuest={guest}
    />
  );
}
describe("RoleChecklist", () => {
  it("labels a native fieldset and supports Tab/Space selection", async () => {
    render(<Harness />);
    const user = userEvent.setup();
    expect(screen.getByRole("group", { name: "Project roles" })).toBeVisible();
    await user.tab();
    expect(
      screen.getByRole("checkbox", { name: "Project admin" }),
    ).toHaveFocus();
    await user.keyboard(" ");
    expect(
      screen.getByRole("checkbox", { name: "Project admin" }),
    ).toBeChecked();
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("checkbox", { name: "PM" })).toBeChecked();
  });
  it.each([
    [true, true],
    [false, false],
  ] as const)(
    "never offers administrator when guest=%s, administrator=%s",
    (guest, administrator) => {
      render(<Harness guest={guest} administrator={administrator} />);
      expect(
        screen.queryByRole("checkbox", { name: "Project admin" }),
      ).not.toBeInTheDocument();
    },
  );
  it("connects the error and disables all choices", () => {
    render(
      <RoleChecklist
        value={[]}
        onChange={() => undefined}
        allowAdministrator
        forGuest={false}
        disabled
        error="Choose at least one role."
      />,
    );
    expect(
      screen.getByRole("group", { name: "Project roles" }),
    ).toHaveAccessibleDescription("Choose at least one role.");
    for (const checkbox of screen.getAllByRole("checkbox"))
      expect(checkbox).toBeDisabled();
  });
});
