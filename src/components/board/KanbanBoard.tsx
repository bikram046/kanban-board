"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { BoardColumn } from "@/components/board/BoardColumn";
import { CardModal } from "@/components/board/CardModal";
import { CardPreview } from "@/components/board/CardItem";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBoard } from "@/hooks/useBoard";
import { useRealtime } from "@/hooks/useRealtime";
import type { BoardData, KanbanCard, KanbanColumn } from "@/lib/types";

function findColumnByCard(columns: KanbanColumn[], cardId: string) {
  return columns.find((column) => column.cards.some((card) => card.id === cardId));
}

function moveCard(columns: KanbanColumn[], activeId: string, overId: string): KanbanColumn[] | null {
  const sourceColumn = findColumnByCard(columns, activeId);

  if (!sourceColumn) {
    return null;
  }

  const activeCard = sourceColumn.cards.find((card) => card.id === activeId);

  if (!activeCard) {
    return null;
  }

  const overColumnId = overId.startsWith("column:") ? overId.replace("column:", "") : undefined;
  const targetColumn = overColumnId ? columns.find((column) => column.id === overColumnId) : findColumnByCard(columns, overId);

  if (!targetColumn) {
    return null;
  }

  if (sourceColumn.id === targetColumn.id && activeId === overId) {
    return null;
  }

  const nextColumns = columns.map((column) => ({
    ...column,
    cards: column.cards.filter((card) => card.id !== activeId)
  }));

  const targetAfterRemoval = nextColumns.find((column) => column.id === targetColumn.id);

  if (!targetAfterRemoval) {
    return null;
  }

  const overCardIndex = targetAfterRemoval.cards.findIndex((card) => card.id === overId);
  const insertIndex = overColumnId ? targetAfterRemoval.cards.length : Math.max(overCardIndex, 0);

  targetAfterRemoval.cards.splice(insertIndex, 0, {
    ...activeCard,
    column_id: targetAfterRemoval.id
  });

  return nextColumns.map((column) => ({
    ...column,
    cards: column.cards.map((card, index) => ({ ...card, position: index }))
  }));
}

function didCardLayoutChange(currentColumns: KanbanColumn[], nextColumns: KanbanColumn[]) {
  const currentCards = currentColumns.flatMap((column) =>
    column.cards.map((card) => ({ id: card.id, columnId: column.id, position: card.position }))
  );
  const currentById = new Map(currentCards.map((card) => [card.id, card]));

  return nextColumns.some((column) =>
    column.cards.some((card, index) => {
      const current = currentById.get(card.id);
      return !current || current.columnId !== column.id || current.position !== index;
    })
  );
}

export function KanbanBoard({ boardId, initialData }: { boardId: string; initialData: BoardData }) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [columnTitle, setColumnTitle] = useState("");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [dragColumns, setDragColumns] = useState<KanbanColumn[] | null>(null);
  const dragColumnsRef = useRef<KanbanColumn[] | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const {
    boardQuery,
    createCard,
    createColumn,
    deleteCard,
    deleteColumn,
    reorderCards,
    updateCard,
    updateColumnTitle
  } = useBoard(boardId, initialData);

  const data = boardQuery.data;
  const displayedColumns = dragColumns ?? data.columns;
  const columnIds = useMemo(() => data.columns.map((column) => column.id), [data.columns]);
  const selectedCard =
    selectedCardId ? data.columns.flatMap((column) => column.cards).find((card) => card.id === selectedCardId) ?? null : null;
  const activeCard =
    activeCardId ? displayedColumns.flatMap((column) => column.cards).find((card) => card.id === activeCardId) ?? null : null;

  useRealtime(boardId, columnIds);

  const updateDragColumns = (columns: KanbanColumn[] | null) => {
    dragColumnsRef.current = columns;
    setDragColumns(columns);
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
    updateDragColumns(data.columns);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const sourceColumns = dragColumnsRef.current ?? data.columns;
    updateDragColumns(moveCard(sourceColumns, String(active.id), String(over.id)) ?? sourceColumns);
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const previewColumns = dragColumnsRef.current;

    setActiveCardId(null);
    updateDragColumns(null);

    if (!over) {
      return;
    }

    const nextColumns = previewColumns ?? moveCard(data.columns, String(active.id), String(over.id));

    if (nextColumns && didCardLayoutChange(data.columns, nextColumns)) {
      reorderCards.mutate(nextColumns);
    }
  };

  const onDragCancel = () => {
    setActiveCardId(null);
    updateDragColumns(null);
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <DndContext
        collisionDetection={closestCorners}
        sensors={sensors}
        onDragCancel={onDragCancel}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragStart={onDragStart}
      >
        <div className="flex h-full gap-4 overflow-x-auto px-4 py-6 sm:px-6">
          {boardQuery.isFetching && !displayedColumns.length ? (
            <>
              <Skeleton className="h-[calc(100vh-8rem)] w-[20rem] shrink-0" />
              <Skeleton className="h-[calc(100vh-8rem)] w-[20rem] shrink-0" />
              <Skeleton className="h-[calc(100vh-8rem)] w-[20rem] shrink-0" />
            </>
          ) : (
            displayedColumns.map((column, index) => (
              <BoardColumn
                key={column.id}
                column={column}
                index={index}
                onAddCard={(columnId, title) => createCard.mutate({ columnId, title })}
                onCardClick={(card) => setSelectedCardId(card.id)}
                onDeleteColumn={(columnId) => deleteColumn.mutate(columnId)}
                onRenameColumn={(columnId, title) => updateColumnTitle.mutate({ columnId, title })}
              />
            ))
          )}

          <Dialog open={columnDialogOpen} onOpenChange={setColumnDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 w-[20rem] shrink-0 justify-start bg-card" type="button" variant="outline">
                <Plus className="h-4 w-4" />
                Add column
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add column</DialogTitle>
                <DialogDescription>Create a new lane for this board.</DialogDescription>
              </DialogHeader>
              <form
                className="grid gap-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  createColumn.mutate(columnTitle, {
                    onSuccess: () => {
                      setColumnTitle("");
                      setColumnDialogOpen(false);
                    }
                  });
                }}
              >
                <div className="grid gap-2">
                  <Label htmlFor="column-title">Title</Label>
                  <Input
                    id="column-title"
                    value={columnTitle}
                    onChange={(event) => setColumnTitle(event.target.value)}
                    autoFocus
                  />
                </div>
                <Button disabled={createColumn.isPending} type="submit">
                  Create column
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <DragOverlay
          adjustScale={false}
          dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}
        >
          {activeCard ? (
            <div className="w-[20rem] cursor-grabbing">
              <CardPreview card={activeCard} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {!displayedColumns.length && !boardQuery.isFetching ? (
        <div className="pointer-events-none absolute inset-x-4 top-32 rounded-md border border-dashed bg-card p-8 text-center shadow-sm sm:inset-x-6">
          <h2 className="text-xl font-semibold">No columns yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Add a column to start building this board.</p>
        </div>
      ) : null}

      <CardModal
        card={selectedCard}
        open={Boolean(selectedCard)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCardId(null);
          }
        }}
        onDelete={(cardId) => deleteCard.mutate(cardId)}
        onSave={(cardId, values) => updateCard.mutate({ cardId, values })}
      />
    </div>
  );
}
