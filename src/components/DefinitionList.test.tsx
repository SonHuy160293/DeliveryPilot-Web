import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DefinitionList } from "@/components/DefinitionList";

describe("definition lists", () => {
  it("pairs terms with values and retains zero", () => {
    render(
      <DefinitionList
        items={[
          { id: "name", label: "Name", value: "Recorded value" },
          { id: "count", label: "Count", value: 0 },
        ]}
      />,
    );
    expect(screen.getAllByRole("term").map((item) => item.textContent)).toEqual(
      ["Name", "Count"],
    );
    expect(
      screen.getAllByRole("definition").map((item) => item.textContent),
    ).toEqual(["Recorded value", "0"]);
  });
  it("labels absent values without inventing records", () => {
    render(
      <DefinitionList
        items={[
          { id: "a", label: "One", value: null },
          { id: "b", label: "Two", value: undefined },
          { id: "c", label: "Three", value: "" },
        ]}
      />,
    );
    expect(screen.getAllByText("Not recorded")).toHaveLength(3);
  });
});
