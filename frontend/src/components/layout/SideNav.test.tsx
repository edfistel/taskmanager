import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { SideNav } from "./SideNav";

describe("SideNav", () => {
  it("shows the brand and an accessible menu toggle in the expanded sidebar", () => {
    render(
      <MemoryRouter>
        <SideNav onOpenSettings={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText("TaskFlow")).toBeVisible();
    expect(screen.getByRole("button", { name: "Recolher menu lateral" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("img", { name: /logo taskflow/i })).toBeVisible();
  });
});
