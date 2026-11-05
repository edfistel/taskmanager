import { ArrowLeft, Layers3 } from "lucide-react";
import { Link } from "react-router";

import type { Quadro } from "../../lib/api/types";
import styles from "./board.module.css";

interface BoardHeaderProps {
  board: Quadro;
  listCount: number;
}

export function BoardHeader({ board, listCount }: BoardHeaderProps) {
  return (
    <section className={styles.boardHeader}>
      <div className={styles.headerCopy}>
        <Link className={styles.backLink} to="/">
          <ArrowLeft aria-hidden="true" size={17} /> Voltar aos quadros
        </Link>
        <p>{board.descricao || "Organize as etapas e acompanhe o progresso deste projeto."}</p>
      </div>
      <div aria-label={`${listCount} ${listCount === 1 ? "lista" : "listas"}`} className={styles.listCounter}>
        <Layers3 aria-hidden="true" size={18} />
        <span><strong>{listCount}</strong> {listCount === 1 ? "lista" : "listas"}</span>
      </div>
    </section>
  );
}
