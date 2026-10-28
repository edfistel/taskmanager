import styles from "./brand.module.css";

interface TaskFlowLogoProps {
  compact?: boolean;
  inverse?: boolean;
}

export function TaskFlowLogo({ compact = false, inverse = false }: TaskFlowLogoProps) {
  return (
    <div
      aria-label="TaskFlow"
      className={`${styles.logo} ${compact ? styles.compact : ""} ${inverse ? styles.inverse : ""}`}
    >
      <span aria-hidden="true" className={styles.mark}>
        T
      </span>
      {!compact && <span className={styles.wordmark}>TaskFlow</span>}
    </div>
  );
}
