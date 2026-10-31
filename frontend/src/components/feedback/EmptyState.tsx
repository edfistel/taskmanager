import type { ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";

import styles from "./feedback.module.css";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  icon?: ReactNode;
  onAction?(): void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  icon = <LayoutDashboard aria-hidden="true" size={24} />,
  onAction,
}: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <div className={styles.stateInner}>
        <span className={styles.icon}>{icon}</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        {actionLabel && onAction && (
          <button className={styles.action} onClick={onAction} type="button">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
