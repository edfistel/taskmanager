import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { SideNav } from "./SideNav";

describe("SideNav", () => {
  it("marks the TaskFlow logo to collapse inside the compact sidebar", () => {
    render(
      <MemoryRouter>
        <SideNav onOpenSettings={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("TaskFlow")).toHaveAttribute(
      "data-collapse-at-tablet",
      "true",
    );
    expect(screen.getByRole("img", { name: /logo taskflow/i })).toBeVisible();
  });
});
