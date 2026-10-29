import type { CSSProperties } from "react";
import {
  ArrowUpRight,
  Boxes,
  Compass,
  Layers3,
  Pencil,
  Rocket,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router";

import type { Quadro } from "../../lib/api/types";
import styles from "./dashboard.module.css";

interface BoardCardProps {
  board: Quadro;
  onEdit(board: Quadro): void;
  onDelete(board: Quadro): void;
}

interface BoardVisual {
  accent: string;
  icon: LucideIcon;
  patternClass: string;
}

const BOARD_VISUALS: BoardVisual[] = [
  { accent: "#43ddb2", icon: Layers3, patternClass: styles.patternGrid },
  { accent: "#7f8cff", icon: Compass, patternClass: styles.patternOrbit },
  { accent: "#f29f67", icon: Rocket, patternClass: styles.patternDiagonal },
  { accent: "#d878b8", icon: Target, patternClass: styles.patternDots },
  { accent: "#58b8e8", icon: Boxes, patternClass: styles.patternMesh },
];

function getBoardVisual(board: Quadro): BoardVisual {
  const seed = `${board.id}:${board.nome}`;
  let hash = 0;
  for (const character of seed) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return BOARD_VISUALS[Math.abs(hash) % BOARD_VISUALS.length];
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
  const visual = getBoardVisual(board);
  const BoardIcon = visual.icon;
  const cardStyle = {
    "--board-accent": visual.accent,
  } as CSSProperties;

  return (
    <article className={styles.boardCard} style={cardStyle}>
      <div className={styles.cardTopline}>
        <span
          aria-hidden="true"
          className={`${styles.boardMark} ${visual.patternClass}`}
        >
          <BoardIcon size={21} strokeWidth={1.8} />
        </span>
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
