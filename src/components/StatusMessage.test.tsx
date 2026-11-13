import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Link, MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { StatusMessage } from "@/components/StatusMessage";
import { ROUTES } from "@/lib/routes";

function Harness({ mock = false }: { mock?: boolean }) {
  const [message, setMessage] = useState<string | null>("Updated.");
  return (
    <>
      <StatusMessage
        message={message}
        mock={mock}
        onDismiss={() => {
          setMessage(null);
        }}
      />
      <Link to={ROUTES.portal}>Continue</Link>
    </>
  );
}
describe("status messages", () => {
  it("announces success and supports keyboard dismissal", async () => {
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Updated.");
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("button", { name: "Dismiss" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("clears when the route changes", async () => {
    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );
    await userEvent.click(screen.getByRole("link", { name: "Continue" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
  it("labels a mock outcome as unsaved", () => {
    render(
      <MemoryRouter>
        <Harness mock />
      </MemoryRouter>,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Updated. (sample data — not saved to a server)",
    );
  });
  it("never hides on a timer", () => {
    vi.useFakeTimers();
    try {
      render(
        <MemoryRouter>
          <Harness />
        </MemoryRouter>,
      );
      vi.advanceTimersByTime(600_000);
      expect(screen.getByRole("status")).toBeVisible();
    } finally {
      vi.useRealTimers();
    }
  });
});
