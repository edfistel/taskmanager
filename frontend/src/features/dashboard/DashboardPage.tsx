import { useMemo, useState } from "react";
import { CheckSquare2, Plus, Search, X } from "lucide-react";

import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { BoardGridSkeleton } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import type { Quadro } from "../../lib/api/types";
import { BoardCard } from "./BoardCard";
import { BoardFormDialog } from "./BoardFormDialog";
import { DeleteBoardDialog } from "./DeleteBoardDialog";
import { useBoards, useCreateBoard, useDeleteBoard, useUpdateBoard } from "./useBoards";
import type { CreateBoardInput } from "./boardsApi";
import styles from "./dashboard.module.css";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir esta ação. Tente novamente.";
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function DashboardPage() {
  const boardsQuery = useBoards();
  const createBoard = useCreateBoard();
  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [formBoard, setFormBoard] = useState<Quadro | "new" | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Quadro | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const boards = boardsQuery.data ?? [];
  const normalizedSearch = normalizeSearch(search);
  const filteredBoards = useMemo(() => {
    if (!normalizedSearch) return boards;
    return boards.filter((board) =>
      normalizeSearch(`${board.nome} ${board.descricao ?? ""}`).includes(normalizedSearch),
    );
  }, [boards, normalizedSearch]);

  function openCreate() {
    setFormError(null);
    setFormBoard("new");
  }

  function openEdit(board: Quadro) {
    setFormError(null);
    setFormBoard(board);
  }

  async function saveBoard(input: CreateBoardInput) {
    setFormError(null);
    try {
      if (formBoard === "new") {
        await createBoard.mutateAsync(input);
        showToast("Quadro criado com sucesso.", "success");
      } else if (formBoard) {
        await updateBoard.mutateAsync({ id: formBoard.id, input });
        showToast("Quadro atualizado.", "success");
      }
      setFormBoard(null);
    } catch (error) {
      setFormError(errorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!boardToDelete) return;
    try {
      await deleteBoard.mutateAsync(boardToDelete.id);
      showToast("Quadro excluído.", "success");
      setBoardToDelete(null);
    } catch (error) {
      showToast(errorMessage(error), "error");
    }
  }

  const formBusy = createBoard.isPending || updateBoard.isPending;

  return (
    <div className={styles.dashboard}>
      <section className={styles.welcome}>
        <div>
          <span className={styles.sectionEyebrow}>Seu fluxo de trabalho</span>
          <h2>Transforme planos em progresso.</h2>
          <p>Crie quadros para organizar projetos, prioridades e entregas com clareza.</p>
        </div>
        <button className={styles.newBoardButton} onClick={openCreate} type="button">
          <Plus aria-hidden="true" size={19} /> Novo quadro
        </button>
      </section>

      <section aria-labelledby="boards-title" className={styles.boardsSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.headingGroup}>
            <div>
              <h2 id="boards-title">Meus quadros</h2>
              <p>Todos os espaços que pertencem a você.</p>
            </div>
            {!boardsQuery.isPending && !boardsQuery.isError && (
              <span className={styles.countPill}>{boards.length}</span>
            )}
          </div>
          {boards.length > 0 && (
            <label className={styles.searchField}>
              <Search aria-hidden="true" size={18} />
              <span className={styles.visuallyHidden}>Buscar quadros</span>
              <input
                aria-label="Buscar quadros"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar quadros"
                type="search"
                value={search}
              />
              {search && (
                <button aria-label="Limpar busca" onClick={() => setSearch("")} type="button">
                  <X aria-hidden="true" size={16} />
                </button>
              )}
            </label>
          )}
        </div>

        {boardsQuery.isPending ? (
          <BoardGridSkeleton />
        ) : boardsQuery.isError ? (
          <ErrorState
            description="Verifique sua conexão e tente carregar os dados novamente."
            onRetry={() => void boardsQuery.refetch()}
            title="Não foi possível carregar seus quadros"
          />
        ) : boards.length === 0 ? (
          <EmptyState
            actionLabel="Criar primeiro quadro"
            description="Comece com um espaço para reunir as tarefas e prioridades do seu próximo projeto."
            onAction={openCreate}
            title="Seu primeiro quadro começa aqui"
          />
        ) : filteredBoards.length === 0 ? (
          <EmptyState
            actionLabel="Limpar busca"
            description={`Nenhum quadro corresponde a “${search}”.`}
            onAction={() => setSearch("")}
            title="Nenhum resultado encontrado"
          />
        ) : (
          <div className={styles.boardGrid}>
            {filteredBoards.map((board) => (
              <BoardCard
                board={board}
                key={board.id}
                onDelete={setBoardToDelete}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="assigned-title" className={styles.assignmentsBoundary}>
        <span className={styles.assignmentIcon}>
          <CheckSquare2 aria-hidden="true" size={22} />
        </span>
        <div>
          <h2 id="assigned-title">Atribuídas a mim</h2>
          <p>O resumo das suas tarefas aparecerá aqui quando conectarmos a etapa de atribuições.</p>
        </div>
        <span className={styles.soonPill}>Próxima etapa</span>
      </section>

      <BoardFormDialog
        board={formBoard === "new" ? null : formBoard}
        busy={formBusy}
        errorMessage={formError}
        onClose={() => setFormBoard(null)}
        onSubmit={saveBoard}
        open={formBoard !== null}
      />
      <DeleteBoardDialog
        board={boardToDelete}
        busy={deleteBoard.isPending}
        onClose={() => setBoardToDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
