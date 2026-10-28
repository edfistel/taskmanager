import { WifiOff } from "lucide-react";

import styles from "./feedback.module.css";

interface ErrorStateProps {
  title: string;
  description: string;
  retryLabel?: string;
  onRetry(): void;
}

export function ErrorState({
  title,
  description,
  retryLabel = "Tentar novamente",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={styles.state} role="alert">
      <div className={styles.stateInner}>
        <span className={`${styles.icon} ${styles.errorIcon}`}>
          <WifiOff aria-hidden="true" size={24} />
        </span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <button className={styles.action} onClick={onRetry} type="button">
          {retryLabel}
        </button>
      </div>
    </div>
  );
}
