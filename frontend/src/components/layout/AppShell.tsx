import { lazy, Suspense, useState, type PropsWithChildren } from "react";
import { ChevronDown } from "lucide-react";

import { useAuth } from "../../lib/auth/useAuth";
import { MobileNav } from "./MobileNav";
import { SideNav } from "./SideNav";
import { loadSidebarCollapsed, saveSidebarCollapsed } from "./sidebarPreference";
import styles from "./layout.module.css";

const SettingsDrawer = lazy(() => import("../../features/settings/SettingsDrawer").then((module) => ({ default: module.SettingsDrawer })));

interface AppShellProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
}

export function AppShell({ title, eyebrow, children }: AppShellProps) {
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(loadSidebarCollapsed);
  function toggleSidebar() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    saveSidebarCollapsed(next);
  }
  const initials = user?.nome
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() ?? "TF";

  return (
    <div className={styles.shell} data-sidebar-collapsed={sidebarCollapsed}>
      <SideNav collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} onOpenSettings={() => setSettingsOpen(true)} />
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
            <h1>{title}</h1>
          </div>
          <div className={styles.topActions}>
            <button aria-label="Configurações da conta" className={styles.profileButton} onClick={() => setSettingsOpen(true)} type="button">
              <span className={styles.avatar}>{initials}</span>
              <span className={styles.profileCopy}><strong>{user?.nome}</strong><small>{user?.email}</small></span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
      <MobileNav onOpenSettings={() => setSettingsOpen(true)} />
      {settingsOpen && <Suspense fallback={<p role="status">Abrindo configurações…</p>}><SettingsDrawer open onClose={() => setSettingsOpen(false)} /></Suspense>}
    </div>
  );
}
