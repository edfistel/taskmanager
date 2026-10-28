import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import {
  loadPreferences,
  resolveTheme,
  savePreferences,
  type Preferences,
  type ResolvedTheme,
} from "./preferences";

interface PreferencesContextValue {
  preferences: Preferences;
  resolvedTheme: ResolvedTheme;
  updatePreferences(next: Partial<Preferences>): void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function initialSystemDark(): boolean {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [systemDark, setSystemDark] = useState(initialSystemDark);
  const resolvedTheme = resolveTheme(preferences.theme, systemDark);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return;
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener?.("change", handleChange);
    return () => query.removeEventListener?.("change", handleChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolvedTheme;
    root.dataset.density = preferences.density;
    root.classList.toggle("reduce-motion", preferences.reduceMotion);
    savePreferences(preferences);
  }, [preferences, resolvedTheme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      resolvedTheme,
      updatePreferences: (next) =>
        setPreferences((current) => ({ ...current, ...next })),
    }),
    [preferences, resolvedTheme],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences deve ser usado dentro de PreferencesProvider.");
  }
  return context;
}
