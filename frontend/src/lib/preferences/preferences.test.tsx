import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  resolveTheme,
  savePreferences,
} from "./preferences";
import {
  PreferencesProvider,
  usePreferences,
} from "./PreferencesProvider";

describe("visual preferences", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.removeAttribute("data-density");
    document.documentElement.classList.remove("reduce-motion");
  });

  it("defaults to system theme and comfortable density", () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES);
    expect(loadPreferences()).toMatchObject({
      theme: "system",
      density: "comfortable",
      reduceMotion: false,
    });
  });

  it("resolves system, light and dark themes deterministically", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("persists only valid preference values", () => {
    savePreferences({ theme: "dark", density: "compact", reduceMotion: true });

    expect(loadPreferences()).toEqual({
      theme: "dark",
      density: "compact",
      reduceMotion: true,
    });
  });

  it("applies theme, density and reduced motion to the document root", () => {
    const { result } = renderHook(() => usePreferences(), {
      wrapper: PreferencesProvider,
    });

    act(() => {
      result.current.updatePreferences({
        theme: "dark",
        density: "compact",
        reduceMotion: true,
      });
    });

    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(document.documentElement).toHaveAttribute("data-density", "compact");
    expect(document.documentElement).toHaveClass("reduce-motion");
  });
});
