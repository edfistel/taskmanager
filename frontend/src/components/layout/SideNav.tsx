import { CheckSquare2, LayoutDashboard, Settings2 } from "lucide-react";
import { NavLink } from "react-router";

import { TaskFlowLogo } from "../brand/TaskFlowLogo";
import styles from "./layout.module.css";

interface SideNavProps {
  onOpenSettings(): void;
}

export function SideNav({ onOpenSettings }: SideNavProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarBrand}><TaskFlowLogo collapseAtTablet /></div>
      <nav aria-label="Navegação principal" className={styles.navList}>
        <NavLink className={({ isActive }) => (isActive ? styles.active : "")} end to="/">
          <LayoutDashboard size={20} /><span>Visão geral</span>
        </NavLink>
        <NavLink className={({ isActive }) => (isActive ? styles.active : "")} to="/atribuicoes">
          <CheckSquare2 size={20} /><span>Minhas atribuições</span>
        </NavLink>
      </nav>
      <button className={styles.settingsButton} onClick={onOpenSettings} type="button">
        <Settings2 size={20} /><span>Configurações</span>
      </button>
    </aside>
  );
}
