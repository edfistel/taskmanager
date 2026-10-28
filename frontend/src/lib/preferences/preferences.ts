export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";
export type DensityPreference = "comfortable" | "compact";

export interface Preferences {
  theme: ThemePreference;
  density: DensityPreference;
  reduceMotion: boolean;
}

const PREFERENCES_KEY = "taskflow.preferences";

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  density: "comfortable",
  reduceMotion: false,
};

function isTheme(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function isDensity(value: unknown): value is DensityPreference {
  return value === "comfortable" || value === "compact";
}

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      theme: isTheme(parsed.theme) ? parsed.theme : DEFAULT_PREFERENCES.theme,
      density: isDensity(parsed.density)
        ? parsed.density
        : DEFAULT_PREFERENCES.density,
      reduceMotion:
        typeof parsed.reduceMotion === "boolean"
          ? parsed.reduceMotion
          : DEFAULT_PREFERENCES.reduceMotion,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Preferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function resolveTheme(
  preference: ThemePreference,
  systemDark: boolean,
): ResolvedTheme {
  if (preference === "system") return systemDark ? "dark" : "light";
  return preference;
}
