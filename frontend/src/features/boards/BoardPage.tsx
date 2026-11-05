import { useState } from "react";
import { useParams } from "react-router";

import { ErrorState } from "../../components/feedback/ErrorState";
import { useToast } from "../../components/feedback/ToastProvider";
import { AppShell } from "../../components/layout/AppShell";
import type { CriarTarefaInput, ListaComTarefas, TarefaResumo } from "../../lib/api/types";
import { DeleteTaskDialog } from "../tasks/DeleteTaskDialog";
import { TaskCreateDialog } from "../tasks/TaskCreateDialog";
import { TaskDetailsDrawer } from "../tasks/TaskDetailsDrawer";
import { useCreateTask, useDeleteTask } from "../tasks/useTasks";
import { BoardHeader } from "./BoardHeader";
import { BoardDndProvider } from "./BoardDndProvider";
import { DeleteListDialog } from "./DeleteListDialog";
import { ListComposer } from "./ListComposer";
import { SortableColumn } from "./SortableColumn";
import {
  useBoard,
  useCreateList,
  useDeleteList,
  useRenameList,
} from "./useBoard";
import styles from "./board.module.css";

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Não foi possível concluir esta ação. Tente novamente.";
}

export function BoardPage() {
  const params = useParams();
  const boardId = Number(params.quadroId);
  const { boardQuery, listsQuery } = useBoard(boardId);
  const createList = useCreateList(boardId);
  const renameList = useRenameList(boardId);
  const deleteList = useDeleteList(boardId);
  const createTask = useCreateTask(boardId);
  const deleteTask = useDeleteTask(boardId);
  const { showToast } = useToast();
  const [listToDelete, setListToDelete] = useState<ListaComTarefas | null>(null);
  const [listForNewTask, setListForNewTask] = useState<ListaComTarefas | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TarefaResumo | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const board = boardQuery.data;
  const lists = listsQuery.data ?? [];

  async function handleCreate(name: string): Promise<boolean> {
    try {
      await createList.mutateAsync(name);
      showToast("Lista criada no final do quadro.", "success");
      return true;
    } catch (error) {
      showToast(errorMessage(error), "error");
      return false;
    }
  }

  async function handleRename(list: ListaComTarefas, name: string): Promise<boolean> {
    try {
      await renameList.mutateAsync({ id: list.id, nome: name });
      showToast("Lista renomeada.", "success");
      return true;
    } catch (error) {
      showToast(errorMessage(error), "error");
      return false;
    }
  }

  async function handleDelete() {
    if (!listToDelete) return;
    try {
      await deleteList.mutateAsync(listToDelete.id);
      showToast("Lista e suas tarefas foram excluídas.", "success");
      setListToDelete(null);
    } catch (error) {
      showToast(errorMessage(error), "error");
      if (errorMessage(error) === "O quadro precisa ter ao menos uma lista") {
        setListToDelete(null);
        void listsQuery.refetch();
      }
    }
  }

  async function handleCreateTask(input: CriarTarefaInput): Promise<boolean> {
    if (!listForNewTask) return false;
    try {
      await createTask.mutateAsync({ listId: listForNewTask.id, input });
      showToast("Tarefa criada no final da lista.", "success");
      return true;
    } catch (error) {
      showToast(errorMessage(error), "error");
      return false;
    }
  }

  async function handleDeleteTask() {
    if (!taskToDelete) return;
    try {
      await deleteTask.mutateAsync(taskToDelete.id);
      showToast("Tarefa e seus vínculos foram excluídos.", "success");
      setTaskToDelete(null);
    } catch (error) {
      showToast(errorMessage(error), "error");
    }
  }

  const title = board?.nome ?? (boardQuery.isError ? "Quadro" : "Carregando quadro…");

  return (
    <AppShell eyebrow="Visão do projeto" title={title}>
      {!Number.isInteger(boardId) || boardId <= 0 ? (
        <ErrorState
          description="O endereço deste quadro não é válido. Volte para a visão geral e abra um quadro novamente."
          onRetry={() => window.location.assign("/")}
          retryLabel="Voltar aos quadros"
          title="Quadro inválido"
        />
      ) : boardQuery.isError ? (
        <ErrorState
          description="Não conseguimos identificar este quadro. Verifique sua conexão ou tente novamente."
          onRetry={() => void boardQuery.refetch()}
          title="Não foi possível carregar o quadro"
        />
      ) : boardQuery.isPending || !board ? (
        <div aria-label="Carregando quadro" className={styles.boardLoading} role="status">
          <span />
          <span />
          <div><i /><i /><i /></div>
        </div>
      ) : (
        <div className={styles.boardPage}>
          <BoardHeader board={board} listCount={lists.length} />
          {listsQuery.isError ? (
            <ErrorState
              description="O quadro foi identificado, mas suas listas não foram carregadas. Tente novamente."
              onRetry={() => void listsQuery.refetch()}
              title="Não foi possível carregar as listas"
            />
          ) : listsQuery.isPending ? (
            <div aria-label="Carregando listas" className={styles.columnsLoading} role="status">
              <span /><span /><span />
            </div>
          ) : (
            <BoardDndProvider boardId={boardId} lists={lists}>
              {({ lists: displayLists, moveTask }) => (
                <section aria-label="Listas do quadro" className={styles.boardScroller}>
                  {displayLists.map((list, index) => (
                    <SortableColumn
                      index={index}
                      isOnlyList={displayLists.length <= 1}
                      key={list.id}
                      list={list}
                      lists={displayLists}
                      onCreateTask={setListForNewTask}
                      onDelete={setListToDelete}
                      onDeleteTask={setTaskToDelete}
                      onMoveTask={moveTask}
                      onOpenTask={(task) => setSelectedTaskId(task.id)}
                      onRename={handleRename}
                      renameBusy={renameList.isPending}
                    />
                  ))}
                  <ListComposer busy={createList.isPending} onCreate={handleCreate} />
                </section>
              )}
            </BoardDndProvider>
          )}
        </div>
      )}
      <DeleteListDialog
        busy={deleteList.isPending}
        list={listToDelete}
        onClose={() => setListToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
      <TaskCreateDialog
        busy={createTask.isPending}
        list={listForNewTask}
        onClose={() => setListForNewTask(null)}
        onSubmit={handleCreateTask}
        open={listForNewTask !== null}
      />
      <DeleteTaskDialog
        busy={deleteTask.isPending}
        onClose={() => setTaskToDelete(null)}
        onConfirm={() => void handleDeleteTask()}
        task={taskToDelete}
      />
      <TaskDetailsDrawer
        mode="owner"
        onClose={() => setSelectedTaskId(null)}
        taskId={selectedTaskId}
      />
    </AppShell>
  );
}
