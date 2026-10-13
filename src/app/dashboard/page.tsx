import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/board/DashboardClient";
import { createClient } from "@/lib/supabase/server";
import type { Board } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("boards")
    .select("id,title,user_id,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Board[]>();

  if (error) {
    throw error;
  }

  return <DashboardClient initialBoards={data ?? []} userEmail={user.email ?? "Signed in"} />;
}
