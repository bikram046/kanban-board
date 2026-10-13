export type Board = {
  id: string;
  title: string;
  user_id: string;
  created_at: string;
};

export type KanbanColumn = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
  cards: KanbanCard[];
};

export type KanbanCard = {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  position: number;
  created_at: string;
};

export type BoardData = {
  board: Board;
  columns: KanbanColumn[];
};
