import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { BoardCard } from "./BoardCard";

describe("BoardCard", () => {
  it("shows a decorative icon inside the board marker without adding an image announcement", () => {
    const { container } = render(
      <MemoryRouter>
        <BoardCard
          board={{
            id: 11,
            nome: "Projeto Alpha",
            descricao: "Portal institucional",
            criadoEm: "2026-10-20T12:00:00.000Z",
          }}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />
      </MemoryRouter>,
    );

    const decorativeMarker = container.querySelector('span[aria-hidden="true"]');
    expect(decorativeMarker?.querySelector("svg")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
