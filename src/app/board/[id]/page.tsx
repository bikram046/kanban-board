import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { Button } from "@/components/ui/button";
import { getBoardData } from "@/lib/board-data";
import { createClient } from "@/lib/supabase/server";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  try {
    const initialData = await getBoardData(supabase, id);

    return (
      <main className="min-h-screen">
        <header className="flex h-16 items-center gap-3 border-b bg-card px-4 sm:px-6">
          <Button asChild size="icon" variant="ghost">
            <Link aria-label="Back to dashboard" href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold">{initialData.board.title}</h1>
            <p className="text-xs text-muted-foreground">Realtime sync is active on this board.</p>
          </div>
        </header>
        <KanbanBoard boardId={id} initialData={initialData} />
      </main>
    );
  } catch {
    notFound();
  }
}
