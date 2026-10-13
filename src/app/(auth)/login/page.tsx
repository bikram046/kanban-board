import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const { next } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <LoginForm next={next ?? "/dashboard"} />
    </main>
  );
}
