import {
  DragDropProvider,
  DragOverlay,
  PointerSensor,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/react";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useToast } from "../../components/feedback/ToastProvider";
import { queryKeys } from "../../lib/api/queryKeys";
import type { ListaComTarefas } from "../../lib/api/types";
import { TaskCard } from "../tasks/TaskCard";
import { TasksApi } from "../tasks/tasksApi";
import { BoardApi } from "./boardApi";
import styles from "./board.module.css";
import { reorderLists, reorderTask, type TaskMove } from "./reorder";

export interface ListMove {
  id: number;
  toIndex: number;
}

export interface BoardDndActions {
  lists: ListaComTarefas[];
  moveList(move: ListMove): Promise<unknown>;
  moveTask(move: TaskMove): Promise<unknown>;
}

interface BoardDndProviderProps {
  boardId: number;
  lists: ListaComTarefas[];
  children: ReactNode | ((actions: BoardDndActions) => ReactNode);
}

type DragData =
  | { kind: "list"; listId: number; index: number }
  | { kind: "task"; taskId: number; listId: number; index: number };

interface TaskLocation {
  listId: number;
  index: number;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível mover o item.";
}

function findTaskLocation(lists: ListaComTarefas[], taskId: number): TaskLocation | null {
  for (const list of lists) {
    const index = list.tarefas.findIndex((task) => task.id === taskId);
    if (index >= 0) return { listId: list.id, index };
  }
  return null;
}

function eventPoint(event: Event | null): { x: number; y: number } | null {
  if (!event) return null;
  if ("clientX" in event && "clientY" in event) {
    const { clientX, clientY } = event as MouseEvent;
    return { x: clientX, y: clientY };
  }
  if ("touches" in event) {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.touches[0] ?? touchEvent.changedTouches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }
  return null;
}

function TaskDragOverlay({ lists }: { lists: ListaComTarefas[] }) {
  return (
    <DragOverlay
      className={styles.taskDragOverlay}
      disabled={(source) => (source?.data as DragData | undefined)?.kind !== "task"}
      dropAnimation={{ duration: 180, easing: "cubic-bezier(0.25, 1, 0.5, 1)" }}
    >
      {(source) => {
        const data = source.data as DragData | undefined;
        if (data?.kind !== "task") return null;
        const task = lists.flatMap((list) => list.tarefas).find((item) => item.id === data.taskId);
        return task ? <TaskCard onOpen={() => undefined} task={task} /> : null;
      }}
    </DragOverlay>
  );
}

export function BoardDndProvider({ boardId, lists, children }: BoardDndProviderProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const queryKey = queryKeys.lists(boardId);
  const [displayLists, setDisplayLists] = useState(lists);
  const displayListsRef = useRef(lists);
  const draggingRef = useRef(false);
  const dragSnapshotRef = useRef<ListaComTarefas[] | null>(null);
  const activeDragRef = useRef<DragData | null>(null);

  useEffect(() => {
    if (draggingRef.current) return;
    displayListsRef.current = lists;
    setDisplayLists(lists);
  }, [lists]);

  function replaceDisplayLists(next: ListaComTarefas[]) {
    displayListsRef.current = next;
    setDisplayLists(next);
  }

  async function persistListMove(move: ListMove, rollback: ListaComTarefas[]) {
    try {
      await queryClient.cancelQueries({ queryKey, exact: true });
      return await BoardApi.moveList(move.id, move.toIndex);
    } catch (error) {
      replaceDisplayLists(rollback);
      showToast(messageFrom(error), "error");
      throw error;
    } finally {
      await queryClient.invalidateQueries({ queryKey, exact: true });
    }
  }

  async function persistTaskMove(move: TaskMove, rollback: ListaComTarefas[]) {
    try {
      await queryClient.cancelQueries({ queryKey, exact: true });
      return await TasksApi.move(move.taskId, {
        ...(move.fromListId === move.toListId ? {} : { listaId: move.toListId }),
        posicao: move.toIndex,
      });
    } catch (error) {
      replaceDisplayLists(rollback);
      showToast(messageFrom(error), "error");
      throw error;
    } finally {
      await queryClient.invalidateQueries({ queryKey, exact: true });
    }
  }

  async function moveList(move: ListMove) {
    const snapshot = displayListsRef.current;
    replaceDisplayLists(reorderLists(snapshot, move));
    return persistListMove(move, snapshot);
  }

  async function moveTask(move: TaskMove) {
    const snapshot = displayListsRef.current;
    replaceDisplayLists(reorderTask(snapshot, move));
    return persistTaskMove(move, snapshot);
  }

  const actions: BoardDndActions = {
    lists: displayLists,
    moveList,
    moveTask,
  };

  function handleDragStart(event: DragStartEvent) {
    const sourceData = event.operation.source?.data as DragData | undefined;
    if (!sourceData) return;
    draggingRef.current = true;
    dragSnapshotRef.current = displayListsRef.current;
    activeDragRef.current = sourceData;
  }

  function handleDragPosition(event: DragMoveEvent | DragOverEvent) {
    const sourceData = activeDragRef.current;
    const target = event.operation.target;
    const targetData = target?.data as DragData | undefined;
    if (!sourceData || !targetData) return;

    const current = displayListsRef.current;
    const activationPoint = eventPoint(event.operation.activatorEvent);
    const dragCenter = activationPoint
      ? {
          x: activationPoint.x + event.operation.transform.x,
          y: activationPoint.y + event.operation.transform.y,
        }
      : event.operation.shape?.current?.center ?? event.operation.position.current;
    const targetCenter = target?.shape?.center;

    if (sourceData.kind === "list") {
      if (targetData.kind !== "list" || sourceData.listId === targetData.listId) return;
      const sourceIndex = current.findIndex((list) => list.id === sourceData.listId);
      const targetIndex = current.findIndex((list) => list.id === targetData.listId);
      if (sourceIndex < 0 || targetIndex < 0) return;

      const insertAfter = Boolean(targetCenter && dragCenter.x > targetCenter.x);
      let toIndex = targetIndex + (insertAfter ? 1 : 0);
      if (sourceIndex < toIndex) toIndex -= 1;
      if (sourceIndex === toIndex) return;
      replaceDisplayLists(reorderLists(current, { id: sourceData.listId, toIndex }));
      return;
    }

    const sourceLocation = findTaskLocation(current, sourceData.taskId);
    if (!sourceLocation) return;

    let toListId: number;
    let insertionIndex: number;
    if (targetData.kind === "task") {
      if (targetData.taskId === sourceData.taskId) return;
      const targetLocation = findTaskLocation(current, targetData.taskId);
      if (!targetLocation) return;
      const insertAfter = Boolean(targetCenter && dragCenter.y > targetCenter.y);
      toListId = targetLocation.listId;
      insertionIndex = targetLocation.index + (insertAfter ? 1 : 0);
    } else {
      const targetList = current.find((list) => list.id === targetData.listId);
      if (!targetList) return;
      toListId = targetList.id;
      insertionIndex = targetList.tarefas.length;
    }

    let toIndex = insertionIndex;
    if (sourceLocation.listId === toListId && sourceLocation.index < insertionIndex) {
      toIndex -= 1;
    }
    if (sourceLocation.listId === toListId && sourceLocation.index === toIndex) return;

    replaceDisplayLists(reorderTask(current, {
      taskId: sourceData.taskId,
      fromListId: sourceLocation.listId,
      toListId,
      toIndex,
    }));
  }

  function resetDragState() {
    draggingRef.current = false;
    dragSnapshotRef.current = null;
    activeDragRef.current = null;
  }

  function handleDragEnd(event: DragEndEvent) {
    const sourceData = activeDragRef.current;
    const snapshot = dragSnapshotRef.current;
    const hasTarget = Boolean(event.operation.target);

    if (!sourceData || !snapshot) {
      resetDragState();
      return;
    }

    if (event.canceled || !hasTarget) {
      replaceDisplayLists(snapshot);
      resetDragState();
      return;
    }

    const finalLists = displayListsRef.current;
    resetDragState();

    if (sourceData.kind === "list") {
      const toIndex = finalLists.findIndex((list) => list.id === sourceData.listId);
      if (toIndex >= 0 && sourceData.index !== toIndex) {
        void persistListMove({ id: sourceData.listId, toIndex }, snapshot).catch(() => undefined);
      }
      return;
    }

    const finalLocation = findTaskLocation(finalLists, sourceData.taskId);
    if (!finalLocation) return;
    if (sourceData.listId === finalLocation.listId && sourceData.index === finalLocation.index) return;
    void persistTaskMove({
      taskId: sourceData.taskId,
      fromListId: sourceData.listId,
      toListId: finalLocation.listId,
      toIndex: finalLocation.index,
    }, snapshot).catch(() => undefined);
  }

  return (
    <DragDropProvider
      onDragStart={handleDragStart}
      onDragMove={handleDragPosition}
      onDragOver={handleDragPosition}
      onDragEnd={handleDragEnd}
      sensors={(defaults) => [
        PointerSensor.configure({
          activationConstraints(event) {
            if (event.pointerType === "touch") {
              return [new PointerActivationConstraints.Delay({ value: 240, tolerance: 8 })];
            }
            return [new PointerActivationConstraints.Distance({ value: 5 })];
          },
        }),
        ...defaults.filter((sensor) => sensor !== PointerSensor),
      ]}
    >
      {typeof children === "function" ? children(actions) : children}
      <TaskDragOverlay lists={displayLists} />
    </DragDropProvider>
  );
}
