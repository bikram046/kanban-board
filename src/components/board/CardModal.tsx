"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { KanbanCard } from "@/lib/types";

export function CardModal({
  card,
  open,
  onOpenChange,
  onDelete,
  onSave
}: {
  card: KanbanCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (cardId: string) => void;
  onSave: (cardId: string, values: Pick<KanbanCard, "title" | "description" | "due_date">) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? "");
      setDueDate(card.due_date ?? "");
    }
  }, [card]);

  if (!card) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Card details</DialogTitle>
          <DialogDescription>Update the card title, notes, and due date.</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(card.id, {
              title,
              description: description.trim() ? description : null,
              due_date: dueDate || null
            });
            onOpenChange(false);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="card-title">Title</Label>
            <Input id="card-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="card-description">Description</Label>
            <Textarea
              id="card-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="card-due-date">Due date</Label>
            <Input
              id="card-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                onDelete(card.id);
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete card
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
