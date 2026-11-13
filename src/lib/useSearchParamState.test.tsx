import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { expect, it } from "vitest";
import { useSearchParamState } from "@/lib/useSearchParamState";
import { ROUTES } from "@/lib/routes";

function Harness() {
  const [value, setValue] = useSearchParamState("status", "all");
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <output aria-label="Status value">{value}</output>
      <output aria-label="Search parameters">{location.search}</output>
      <button
        onClick={() => {
          setValue("active");
        }}
      >
        Set active
      </button>
      <button
        onClick={() => {
          setValue("all");
        }}
      >
        Clear status
      </button>
      <button
        onClick={() => {
          void navigate(-1);
        }}
      >
        Back
      </button>
      <button
        onClick={() => {
          void navigate(1);
        }}
      >
        Forward
      </button>
    </>
  );
}
it("preserves other search parameters and restores back/forward values", async () => {
  render(
    <MemoryRouter initialEntries={[`${ROUTES.workspaces}?q=record`]}>
      <Harness />
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Set active" }));
  expect(screen.getByLabelText("Status value")).toHaveTextContent("active");
  expect(screen.getByLabelText("Search parameters")).toHaveTextContent(
    "q=record",
  );
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByLabelText("Status value")).toHaveTextContent("all");
  await user.click(screen.getByRole("button", { name: "Forward" }));
  expect(screen.getByLabelText("Status value")).toHaveTextContent("active");
  await user.click(screen.getByRole("button", { name: "Clear status" }));
  expect(screen.getByLabelText("Search parameters")).toHaveTextContent(
    "?q=record",
  );
});
