import logoUrl from "../../assets/LOGO.png";
import styles from "./brand.module.css";

interface TaskFlowLogoProps {
  compact?: boolean;
  inverse?: boolean;
  collapseAtTablet?: boolean;
  prominent?: boolean;
}

export function TaskFlowLogo({
  compact = false,
  inverse = false,
  collapseAtTablet = false,
  prominent = false,
}: TaskFlowLogoProps) {
  return (
    <div
      aria-label="TaskFlow"
      className={`${styles.logo} ${compact ? styles.compact : ""} ${inverse ? styles.inverse : ""} ${prominent ? styles.prominent : ""} ${collapseAtTablet ? styles.collapseAtTablet : ""}`}
      data-collapse-at-tablet={collapseAtTablet || undefined}
    >
      <img alt="Logo TaskFlow" className={styles.mark} src={logoUrl} />
      {!compact && <span className={styles.wordmark}>TaskFlow</span>}
    </div>
  );
}
