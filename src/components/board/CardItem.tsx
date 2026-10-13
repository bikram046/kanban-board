"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays } from "lucide-react";
import type { KanbanCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CardPreview({ card, isOverlay = false }: { card: KanbanCard; isOverlay?: boolean }) {
  return (
    <div
      className={cn(
        "w-full rounded-md border bg-card p-3 text-left shadow-sm transition-colors",
        "hover:border-primary hover:shadow-md",
        isOverlay && "rotate-1 border-primary shadow-xl ring-2 ring-primary/20"
      )}
    >
      <div className="line-clamp-3 text-sm font-medium">{card.title}</div>
      {card.description ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{card.description}</p> : null}
      {card.due_date ? (
        <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(`${card.due_date}T00:00:00`).toLocaleDateString()}
        </div>
      ) : null}
    </div>
  );
}

export function CardItem({
  card,
  columnId,
  onClick
}: {
  card: KanbanCard;
  columnId: string;
  onClick: (card: KanbanCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: "card", card, columnId }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 180ms ease"
  };

  return (
    <button
      ref={setNodeRef}
      className={cn(
        "w-full cursor-grab touch-none rounded-md text-left transition duration-200 active:cursor-grabbing",
        isDragging && "scale-[0.98] opacity-30"
      )}
      style={style}
      type="button"
      onClick={() => onClick(card)}
      {...attributes}
      {...listeners}
    >
      <CardPreview card={card} />
    </button>
  );
}
