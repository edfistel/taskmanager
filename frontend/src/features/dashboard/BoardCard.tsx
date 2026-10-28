import type { CSSProperties } from "react";
import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router";

import type { Quadro } from "../../lib/api/types";
import styles from "./dashboard.module.css";

interface BoardCardProps {
  board: Quadro;
  onEdit(board: Quadro): void;
  onDelete(board: Quadro): void;
}

const ACCENTS = ["#43ddb2", "#7f8cff", "#f29f67", "#d878b8", "#58b8e8"];

function getBoardAccent(board: Quadro): string {
  const seed = `${board.id}:${board.nome}`;
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Quadro do seu espaço";
  return `Criado em ${new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date)}`;
}

export function BoardCard({ board, onEdit, onDelete }: BoardCardProps) {
  const cardStyle = {
    "--board-accent": getBoardAccent(board),
  } as CSSProperties;

  return (
    <article className={styles.boardCard} style={cardStyle}>
      <div className={styles.cardTopline}>
        <span aria-hidden="true" className={styles.boardMark} />
        <div className={styles.cardActions}>
          <button
            aria-label={`Editar ${board.nome}`}
            onClick={() => onEdit(board)}
            title="Editar quadro"
            type="button"
          >
            <Pencil aria-hidden="true" size={16} />
          </button>
          <button
            aria-label={`Excluir ${board.nome}`}
            onClick={() => onDelete(board)}
            title="Excluir quadro"
            type="button"
          >
            <Trash2 aria-hidden="true" size={16} />
          </button>
        </div>
      </div>
      <div className={styles.cardCopy}>
        <span className={styles.cardMeta}>{formatCreatedAt(board.criadoEm)}</span>
        <h3>{board.nome}</h3>
        <p>{board.descricao || "Organize as próximas entregas deste quadro."}</p>
      </div>
      <Link
        aria-label={`Abrir quadro ${board.nome}`}
        className={styles.openBoard}
        to={`/quadros/${board.id}`}
      >
        Abrir quadro <ArrowUpRight aria-hidden="true" size={17} />
      </Link>
    </article>
  );
}
