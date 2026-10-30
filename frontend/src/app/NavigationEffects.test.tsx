import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { NavigationEffects } from "./NavigationEffects";

describe("page navigation", () => {
  it("starts a new page at the top instead of retaining the previous scroll position", async () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    render(<MemoryRouter><NavigationEffects /><Link to="/quadros/1">Abrir quadro</Link></MemoryRouter>);
    scroll.mockClear();
    await userEvent.click(screen.getByRole("link", { name: "Abrir quadro" }));
    expect(scroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "instant" });
  });
});
