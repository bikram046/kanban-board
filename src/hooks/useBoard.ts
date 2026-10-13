"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PostgrestError } from "@supabase/supabase-js";
import { getBoardData } from "@/lib/board-data";
import { createClient } from "@/lib/supabase/client";
import type { BoardData, KanbanCard, KanbanColumn } from "@/lib/types";
import { boardTitleSchema, cardDetailsSchema, cardTitleSchema, columnTitleSchema } from "@/lib/validators";
import { useToast } from "@/components/ui/use-toast";

type QueryContext = { previous?: BoardData };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function nextPosition(items: { position: number }[]) {
  if (!items.length) {
    return 0;
  }

  return Math.max(...items.map((item) => item.position)) + 1;
}

export function useBoard(boardId: string, initialData: BoardData) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ["board", boardId] as const;

  const boardQuery = useQuery({
    queryKey,
    queryFn: () => getBoardData(supabase, boardId),
    initialData
  });

  const createColumn = useMutation({
    mutationFn: async (title: string) => {
      const parsed = columnTitleSchema.parse(title);
      const position = nextPosition(boardQuery.data.columns);
      const { error } = await supabase.from("columns").insert({ board_id: boardId, title: parsed, position });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error) => toast({ title: "Could not add column", description: errorMessage(error), variant: "destructive" })
  });

  const updateColumnTitle = useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      const parsed = columnTitleSchema.parse(title);
      const { error } = await supabase.from("columns").update({ title: parsed }).eq("id", columnId);

      if (error) {
        throw error;
      }
    },
    onMutate: async ({ columnId, title }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardData>(queryKey);
      queryClient.setQueryData<BoardData>(queryKey, (current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((column) => (column.id === columnId ? { ...column, title } : column))
            }
          : current
      );
      return { previous };
    },
    onError: (error, _variables, context?: QueryContext) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({ title: "Could not rename column", description: errorMessage(error), variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey })
  });

  const deleteColumn = useMutation({
    mutationFn: async (columnId: string) => {
      const deleteCards = await supabase.from("cards").delete().eq("column_id", columnId);

      if (deleteCards.error) {
        throw deleteCards.error;
      }

      const deleteColumnResult = await supabase.from("columns").delete().eq("id", columnId);

      if (deleteColumnResult.error) {
        throw deleteColumnResult.error;
      }
    },
    onMutate: async (columnId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardData>(queryKey);
      queryClient.setQueryData<BoardData>(queryKey, (current) =>
        current ? { ...current, columns: current.columns.filter((column) => column.id !== columnId) } : current
      );
      return { previous };
    },
    onError: (error, _variables, context?: QueryContext) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({ title: "Could not delete column", description: errorMessage(error), variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey })
  });

  const createCard = useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      const parsed = cardTitleSchema.parse(title);
      const column = boardQuery.data.columns.find((item) => item.id === columnId);
      const position = nextPosition(column?.cards ?? []);
      const { error } = await supabase
        .from("cards")
        .insert({ column_id: columnId, title: parsed, description: "", due_date: null, position });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (error) => toast({ title: "Could not add card", description: errorMessage(error), variant: "destructive" })
  });

  const updateCard = useMutation({
    mutationFn: async ({ cardId, values }: { cardId: string; values: Pick<KanbanCard, "title" | "description" | "due_date"> }) => {
      const parsed = cardDetailsSchema.parse(values);
      const { error } = await supabase.from("cards").update(parsed).eq("id", cardId);

      if (error) {
        throw error;
      }
    },
    onMutate: async ({ cardId, values }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardData>(queryKey);
      queryClient.setQueryData<BoardData>(queryKey, (current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((column) => ({
                ...column,
                cards: column.cards.map((card) => (card.id === cardId ? { ...card, ...values } : card))
              }))
            }
          : current
      );
      return { previous };
    },
    onError: (error, _variables, context?: QueryContext) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({ title: "Could not update card", description: errorMessage(error), variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey })
  });

  const deleteCard = useMutation({
    mutationFn: async (cardId: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", cardId);

      if (error) {
        throw error;
      }
    },
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardData>(queryKey);
      queryClient.setQueryData<BoardData>(queryKey, (current) =>
        current
          ? {
              ...current,
              columns: current.columns.map((column) => ({
                ...column,
                cards: column.cards.filter((card) => card.id !== cardId)
              }))
            }
          : current
      );
      return { previous };
    },
    onError: (error, _variables, context?: QueryContext) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({ title: "Could not delete card", description: errorMessage(error), variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey })
  });

  const reorderCards = useMutation({
    mutationFn: async (columns: KanbanColumn[]) => {
      const current = boardQuery.data.columns.flatMap((column) =>
        column.cards.map((card) => ({ id: card.id, column_id: card.column_id, position: card.position }))
      );
      const currentById = new Map(current.map((card) => [card.id, card]));
      const updates = columns.flatMap((column) =>
        column.cards.flatMap((card, index) => {
          const previous = currentById.get(card.id);
          const next = { column_id: column.id, position: index };

          if (previous?.column_id === next.column_id && previous.position === next.position) {
            return [];
          }

          return [{ id: card.id, ...next }];
        })
      );

      const results = await Promise.all(
        updates.map((update) =>
          supabase.from("cards").update({ column_id: update.column_id, position: update.position }).eq("id", update.id)
        )
      );

      const error = results.find((result) => result.error)?.error as PostgrestError | undefined;

      if (error) {
        throw error;
      }
    },
    onMutate: async (columns) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardData>(queryKey);
      queryClient.setQueryData<BoardData>(queryKey, (current) =>
        current
          ? {
              ...current,
              columns: columns.map((column, columnIndex) => ({
                ...column,
                position: columnIndex,
                cards: column.cards.map((card, index) => ({
                  ...card,
                  column_id: column.id,
                  position: index
                }))
              }))
            }
          : current
      );
      return { previous };
    },
    onError: (error, _variables, context?: QueryContext) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast({ title: "Could not move card", description: errorMessage(error), variant: "destructive" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey })
  });

  return {
    boardQuery,
    createColumn,
    updateColumnTitle,
    deleteColumn,
    createCard,
    updateCard,
    deleteCard,
    reorderCards
  };
}
