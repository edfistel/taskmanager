import { CheckSquare2, ChevronLeft, ChevronRight, LayoutDashboard, Settings2 } from "lucide-react";
import { NavLink } from "react-router";

import { TaskFlowLogo } from "../brand/TaskFlowLogo";
import styles from "./layout.module.css";

interface SideNavProps {
  collapsed?: boolean;
  onToggleCollapsed?(): void;
  onOpenSettings(): void;
}

export function SideNav({ collapsed = false, onToggleCollapsed, onOpenSettings }: SideNavProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.sidebarBrand}><TaskFlowLogo compact={collapsed} /></div>
        <button aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} aria-expanded={!collapsed} aria-controls="taskflow-sidebar-navigation" title={collapsed ? "Expandir menu" : "Recolher menu"} className={styles.sidebarToggle} onClick={onToggleCollapsed} type="button">
          {collapsed ? <ChevronRight aria-hidden="true" size={18} /> : <ChevronLeft aria-hidden="true" size={18} />}
        </button>
      </div>
      <nav id="taskflow-sidebar-navigation" aria-label="Navegação principal" className={styles.navList}>
        <NavLink aria-label="Visão geral" title={collapsed ? "Visão geral" : undefined} className={({ isActive }) => (isActive ? styles.active : "")} end to="/">
          <LayoutDashboard aria-hidden="true" size={20} /><span hidden={collapsed}>Visão geral</span>
        </NavLink>
        <NavLink aria-label="Minhas atribuições" title={collapsed ? "Minhas atribuições" : undefined} className={({ isActive }) => (isActive ? styles.active : "")} to="/atribuicoes">
          <CheckSquare2 aria-hidden="true" size={20} /><span hidden={collapsed}>Minhas atribuições</span>
        </NavLink>
      </nav>
      <button aria-label="Configurações" title={collapsed ? "Configurações" : undefined} className={styles.settingsButton} onClick={onOpenSettings} type="button">
        <Settings2 aria-hidden="true" size={20} /><span hidden={collapsed}>Configurações</span>
      </button>
    </aside>
  );
}
