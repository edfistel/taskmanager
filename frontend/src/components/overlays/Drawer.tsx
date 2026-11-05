import type { PropsWithChildren } from "react";

import { Modal } from "./Modal";
import styles from "./overlay.module.css";

interface DrawerProps extends PropsWithChildren {
  open: boolean;
  title: string;
  onClose(): void;
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  return (
    <Modal className={styles.drawer} onClose={onClose} open={open} title={title}>
      {children}
    </Modal>
  );
}
