import { CheckSquare2, LayoutDashboard, Settings2 } from "lucide-react";
import { NavLink } from "react-router";

import styles from "./layout.module.css";

interface MobileNavProps { onOpenSettings(): void; }

export function MobileNav({ onOpenSettings }: MobileNavProps) {
  return (
    <nav aria-label="Navegação móvel" className={styles.mobileNav}>
      <NavLink end to="/"><LayoutDashboard size={21} /><span>Início</span></NavLink>
      <NavLink to="/atribuicoes"><CheckSquare2 size={21} /><span>Atribuições</span></NavLink>
      <button onClick={onOpenSettings} type="button"><Settings2 size={21} /><span>Ajustes</span></button>
    </nav>
  );
}
