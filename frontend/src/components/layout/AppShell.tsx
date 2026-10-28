import { useState, type PropsWithChildren } from "react";
import { Bell, ChevronDown } from "lucide-react";

import { useAuth } from "../../lib/auth/useAuth";
import { MobileNav } from "./MobileNav";
import { SideNav } from "./SideNav";
import styles from "./layout.module.css";

interface AppShellProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
}

export function AppShell({ title, eyebrow, children }: AppShellProps) {
  const { user } = useAuth();
  const [settingsHint, setSettingsHint] = useState(false);
  const initials = user?.nome
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() ?? "TF";

  return (
    <div className={styles.shell}>
      <SideNav onOpenSettings={() => setSettingsHint(true)} />
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div>
            {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
            <h1>{title}</h1>
          </div>
          <div className={styles.topActions}>
            <button aria-label="Notificações" className={styles.iconButton} type="button">
              <Bell size={19} />
            </button>
            <button className={styles.profileButton} type="button">
              <span className={styles.avatar}>{initials}</span>
              <span className={styles.profileCopy}><strong>{user?.nome}</strong><small>{user?.email}</small></span>
              <ChevronDown size={16} />
            </button>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
      <MobileNav onOpenSettings={() => setSettingsHint(true)} />
      {settingsHint && (
        <button className={styles.settingsHint} onClick={() => setSettingsHint(false)} type="button">
          As configurações completas chegam nesta mesma engrenagem.
        </button>
      )}
    </div>
  );
}
