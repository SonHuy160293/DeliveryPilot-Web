import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type DataTableProps } from "@/components/DataTable";
import { ROUTES } from "@/lib/routes";

const rows = [{ id: "first", name: "First record", status: "Active" }];
const props: DataTableProps<(typeof rows)[number]> = {
  caption: "Projects",
  rows,
  rowKey: (row) => row.id,
  rowHeader: (row) => <Link to={ROUTES.portal}>{row.name}</Link>,
  columns: [
    { id: "name", header: "Name", cell: (row) => row.name },
    { id: "status", header: "Status", cell: (row) => row.status },
  ],
};
describe("responsive data tables", () => {
  it("renders a caption, column headers and scoped row headers", async () => {
    render(
      <MemoryRouter>
        <DataTable {...props} />
      </MemoryRouter>,
    );
    const table = within(screen.getByRole("table", { name: "Projects" }));
    expect(table.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
      "scope",
      "col",
    );
    expect(
      table.getByRole("rowheader", { name: "First record" }),
    ).toHaveAttribute("scope", "row");
    await userEvent.tab();
    expect(table.getByRole("link", { name: "First record" })).toHaveFocus();
    expect(table.getByRole("rowheader")).not.toHaveAttribute("tabindex");
  });
  it("provides mobile cards with term/value pairs", () => {
    render(
      <MemoryRouter>
        <DataTable {...props} />
      </MemoryRouter>,
    );
    const list = screen.getByRole("list", { name: "Projects" });
    expect(list).toHaveClass("md:hidden");
    expect(within(list).getByRole("term")).toHaveTextContent("Status");
    expect(within(list).getByRole("definition")).toHaveTextContent("Active");
  });
  it("announces loading with five skeleton rows", () => {
    const { container } = render(<DataTable {...props} loading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading Projects");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      5,
    );
  });
  it("loads more deliberately and disables the pending action", async () => {
    const load = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <DataTable {...props} hasMore onLoadMore={load} />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(load).toHaveBeenCalledOnce();
    rerender(
      <MemoryRouter>
        <DataTable {...props} hasMore onLoadMore={load} loadingMore />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: "Loading…" })).toBeDisabled();
  });
  it("has no invented row or load action when empty", () => {
    render(<DataTable {...props} rows={[]} />);
    expect(screen.queryByRole("rowheader")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
