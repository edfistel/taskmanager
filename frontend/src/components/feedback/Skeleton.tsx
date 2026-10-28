import styles from "./feedback.module.css";

interface BoardGridSkeletonProps {
  count?: number;
}

export function BoardGridSkeleton({ count = 3 }: BoardGridSkeletonProps) {
  return (
    <div aria-label="Carregando quadros" className={styles.skeletonGrid} role="status">
      <span className={styles.visuallyHidden}>Carregando quadros…</span>
      {Array.from({ length: count }, (_, index) => (
        <div aria-hidden="true" className={styles.skeletonCard} key={index}>
          <div className={styles.skeletonAccent} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      ))}
    </div>
  );
}
