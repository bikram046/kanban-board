"use client";

import Link from "next/link";
import { LayoutDashboard, LogOut, Plus } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import type { Board } from "@/lib/types";
import { boardTitleSchema } from "@/lib/validators";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function DashboardClient({ initialBoards, userEmail }: { initialBoards: Board[]; userEmail: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { toast } = useToast();

  const boardsQuery = useQuery({
    queryKey: ["boards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boards")
        .select("id,title,user_id,created_at")
        .order("created_at", { ascending: false })
        .returns<Board[]>();

      if (error) {
        throw error;
      }

      return data ?? [];
    },
    initialData: initialBoards
  });

  const createBoard = useMutation({
    mutationFn: async () => {
      const parsedTitle = boardTitleSchema.parse(title);
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("You need to sign in again.");
      }

      const { error } = await supabase.from("boards").insert({ title: parsedTitle, user_id: user.id });

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setOpen(false);
      setTitle("");
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
    onError: (error) => toast({ title: "Could not create board", description: errorMessage(error), variant: "destructive" })
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Boards</h1>
            <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button type="button">
                  <Plus className="h-4 w-4" />
                  New board
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create board</DialogTitle>
                  <DialogDescription>Name the workspace for this Kanban board.</DialogDescription>
                </DialogHeader>
                <form
                  className="grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    createBoard.mutate();
                  }}
                >
                  <div className="grid gap-2">
                    <Label htmlFor="board-title">Title</Label>
                    <Input
                      id="board-title"
                      autoFocus
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </div>
                  <Button disabled={createBoard.isPending} type="submit">
                    Create board
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button aria-label="Sign out" size="icon" type="button" variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {boardsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
        ) : boardsQuery.data.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boardsQuery.data.map((board) => (
              <Link
                key={board.id}
                className="group rounded-md border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                href={`/board/${board.id}`}
              >
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <h2 className="truncate text-lg font-semibold">{board.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Created {new Date(board.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <section className="grid min-h-80 place-items-center rounded-md border border-dashed bg-card p-8 text-center">
            <div>
              <LayoutDashboard className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <h2 className="text-xl font-semibold">No boards yet</h2>
              <p className="mt-2 text-sm text-muted-foreground">Create a board to start organizing cards.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
