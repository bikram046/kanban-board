"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtime(boardId: string, columnIds: string[]) {
  const queryClient = useQueryClient();
  const columnIdSet = columnIds.join(",");

  useEffect(() => {
    const supabase = createClient();
    const knownColumnIds = new Set(columnIds);

    const invalidateBoard = () => {
      void queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    };

    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns", filter: `board_id=eq.${boardId}` },
        invalidateBoard
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "cards" }, (payload) => {
        const newRow = payload.new as { column_id?: string } | null;
        const oldRow = payload.old as { column_id?: string } | null;
        const newColumnId = newRow?.column_id ?? "";
        const oldColumnId = oldRow?.column_id ?? "";

        if (knownColumnIds.has(newColumnId) || knownColumnIds.has(oldColumnId)) {
          invalidateBoard();
        }
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [boardId, columnIdSet, queryClient]);
}
