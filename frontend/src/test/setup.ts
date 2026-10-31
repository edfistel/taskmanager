import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom does not implement browser scrolling; navigation itself is tested separately.
if (typeof window !== "undefined") window.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
});
