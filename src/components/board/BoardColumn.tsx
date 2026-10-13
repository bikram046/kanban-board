"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Check, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardItem } from "@/components/board/CardItem";
import type { KanbanCard, KanbanColumn } from "@/lib/types";
import { cn } from "@/lib/utils";

const headerColors = [
  "border-t-blue-500",
  "border-t-emerald-500",
  "border-t-amber-500",
  "border-t-rose-500",
  "border-t-cyan-500",
  "border-t-violet-500"
];

export function BoardColumn({
  column,
  index,
  onAddCard,
  onCardClick,
  onDeleteColumn,
  onRenameColumn
}: {
  column: KanbanColumn;
  index: number;
  onAddCard: (columnId: string, title: string) => void;
  onCardClick: (card: KanbanCard) => void;
  onDeleteColumn: (columnId: string) => void;
  onRenameColumn: (columnId: string, title: string) => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [addingCard, setAddingCard] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${column.id}`,
    data: { type: "column", columnId: column.id }
  });

  const saveTitle = () => {
    onRenameColumn(column.id, title);
    setEditingTitle(false);
  };

  const submitCard = () => {
    onAddCard(column.id, cardTitle);
    setCardTitle("");
    setAddingCard(false);
  };

  return (
    <section
      className={cn(
        "flex h-[calc(100vh-8rem)] w-[20rem] shrink-0 flex-col rounded-md border-t-4 bg-muted/70 shadow-sm transition-shadow duration-200",
        isOver && "shadow-md",
        headerColors[index % headerColors.length]
      )}
    >
      <header className="flex min-h-14 items-center gap-2 border-b bg-card px-3">
        {editingTitle ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              saveTitle();
            }}
          >
            <Input
              className="h-8"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setTitle(column.title);
                  setEditingTitle(false);
                }
              }}
              autoFocus
            />
            <Button aria-label="Save column title" size="icon" type="submit" variant="ghost">
              <Check className="h-4 w-4" />
            </Button>
            <Button
              aria-label="Cancel column title edit"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => {
                setTitle(column.title);
                setEditingTitle(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <>
            <button
              className="min-w-0 flex-1 truncate rounded-md px-1 py-1 text-left text-sm font-semibold hover:bg-muted"
              type="button"
              onClick={() => setEditingTitle(true)}
            >
              {column.title}
            </button>
            <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{column.cards.length}</span>
            <Button
              aria-label="Delete column"
              size="icon"
              type="button"
              variant="ghost"
              onClick={() => onDeleteColumn(column.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "min-h-0 flex-1 overflow-y-auto p-3 transition-colors duration-200",
          isOver && "bg-primary/10 ring-1 ring-inset ring-primary/20"
        )}
      >
        <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-3">
            {column.cards.map((card) => (
              <CardItem key={card.id} card={card} columnId={column.id} onClick={onCardClick} />
            ))}
            {!column.cards.length ? (
              <div className="rounded-md border border-dashed bg-card/70 p-4 text-center text-sm text-muted-foreground">
                No cards
              </div>
            ) : null}
          </div>
        </SortableContext>
      </div>

      <footer className="border-t bg-card p-3">
        {addingCard ? (
          <form
            className="grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submitCard();
            }}
          >
            <Input
              placeholder="Card title"
              value={cardTitle}
              onChange={(event) => setCardTitle(event.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Button size="sm" type="submit">
                Add card
              </Button>
              <Button
                size="sm"
                type="button"
                variant="ghost"
                onClick={() => {
                  setAddingCard(false);
                  setCardTitle("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button className="w-full justify-start" type="button" variant="ghost" onClick={() => setAddingCard(true)}>
            <Plus className="h-4 w-4" />
            Add card
          </Button>
        )}
      </footer>
    </section>
  );
}
