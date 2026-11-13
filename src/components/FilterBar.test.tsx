import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useSearchParams } from "react-router";
import { describe, expect, it } from "vitest";
import { FilterBar } from "@/components/FilterBar";
import { useSearchParamState } from "@/lib/useSearchParamState";
import { ROUTES } from "@/lib/routes";

function Harness() {
  const [query, setQuery] = useSearchParamState("q");
  const [status, setStatus] = useSearchParamState("status", "all");
  const [, setParams] = useSearchParams();
  return (
    <FilterBar
      search={{
        id: "query",
        label: "Search",
        value: query,
        onChange: setQuery,
      }}
      filters={[
        {
          id: "status",
          label: "Status",
          value: status,
          onChange: setStatus,
          options: [
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
          ],
        },
      ]}
      hasMore
      resultCount={3}
      onReset={() => {
        setParams({});
      }}
    />
  );
}
describe("filter bars", () => {
  it("selects a filter with the keyboard", async () => {
    // jsdom has no layout scrolling; this enables Radix's keyboard semantics.
    const original = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "scrollIntoView",
    );
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: () => {},
    });
    try {
      render(
        <MemoryRouter>
          <Harness />
        </MemoryRouter>,
      );
      const user = userEvent.setup();
      screen.getByRole("combobox", { name: "Status" }).focus();
      await user.keyboard("{Enter}");
      await user.keyboard("{End}{Enter}");
      expect(
        screen.getByRole("combobox", { name: "Status" }),
      ).toHaveTextContent("Active");
    } finally {
      if (original)
        Object.defineProperty(
          HTMLElement.prototype,
          "scrollIntoView",
          original,
        );
      else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }
  });
  it("supports an empty All option without invalid Select values", () => {
    render(
      <FilterBar
        filters={[
          {
            id: "kind",
            label: "Kind",
            value: "",
            onChange: () => {},
            options: [
              { value: "", label: "All" },
              { value: "internal", label: "Internal" },
            ],
          },
        ]}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Kind" })).toHaveTextContent(
      "All",
    );
  });
  it("labels controls and describes the loaded search boundary", () => {
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("textbox", { name: "Search" }),
    ).toHaveAccessibleDescription("Searches loaded results.");
    expect(screen.getByRole("combobox", { name: "Status" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("3 projects");
    expect(
      screen.queryByRole("button", { name: "Clear filters" }),
    ).not.toBeInTheDocument();
  });
  it("supports keyboard search and clearing active filters", async () => {
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByLabelText("Search")).toHaveFocus();
    await user.keyboard("delivery");
    expect(screen.getByLabelText("Search")).toHaveValue("delivery");
    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getByLabelText("Search")).toHaveValue("");
  });
  it("reads selected filter values from the URL", () => {
    render(
      <MemoryRouter initialEntries={[`${ROUTES.workspaces}?status=active`]}>
        <Harness />
      </MemoryRouter>,
    );
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveTextContent(
      "Active",
    );
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeVisible();
  });
  it("announces zero results and omits loaded-only copy when complete", () => {
    render(<FilterBar resultCount={0} />);
    expect(screen.getByRole("status")).toHaveTextContent("0 projects");
    expect(
      screen.queryByText("Searches loaded results."),
    ).not.toBeInTheDocument();
  });
});
