import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board, BoardData, KanbanCard, KanbanColumn } from "@/lib/types";

type RawColumn = Omit<KanbanColumn, "cards">;

export async function getBoardData(supabase: SupabaseClient, boardId: string): Promise<BoardData> {
  const { data: board, error: boardError } = await supabase
    .from("boards")
    .select("id,title,user_id,created_at")
    .eq("id", boardId)
    .single<Board>();

  if (boardError) {
    throw boardError;
  }

  const { data: rawColumns, error: columnsError } = await supabase
    .from("columns")
    .select("id,board_id,title,position,created_at")
    .eq("board_id", boardId)
    .order("position", { ascending: true })
    .returns<RawColumn[]>();

  if (columnsError) {
    throw columnsError;
  }

  const columnIds = rawColumns.map((column) => column.id);
  const cards = columnIds.length
    ? await supabase
        .from("cards")
        .select("id,column_id,title,description,due_date,position,created_at")
        .in("column_id", columnIds)
        .order("position", { ascending: true })
        .returns<KanbanCard[]>()
    : { data: [], error: null };

  if (cards.error) {
    throw cards.error;
  }

  const cardsByColumn = new Map<string, KanbanCard[]>();

  for (const card of cards.data ?? []) {
    const nextCards = cardsByColumn.get(card.column_id) ?? [];
    nextCards.push(card);
    cardsByColumn.set(card.column_id, nextCards);
  }

  return {
    board,
    columns: rawColumns.map((column) => ({
      ...column,
      cards: (cardsByColumn.get(column.id) ?? []).sort((a, b) => a.position - b.position)
    }))
  };
}
