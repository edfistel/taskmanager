const KEY = "taskflow.sidebar-collapsed";

export function loadSidebarCollapsed(): boolean {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "true" || saved === "false") return saved === "true";
  } catch { /* The menu remains usable when browser storage is unavailable. */ }
  return window.matchMedia?.("(min-width: 768px) and (max-width: 1199px)").matches ?? false;
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  try { localStorage.setItem(KEY, String(collapsed)); } catch { /* Keep the current state in memory. */ }
}
