"use client";

import { Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export function LoginForm({ next }: { next: string }) {
  const { toast } = useToast();

  const signIn = async () => {
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <section className="w-full max-w-sm rounded-md border bg-card p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Realtime Kanban</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to manage your boards and collaborate live.</p>
      </div>
      <Button className="w-full" type="button" onClick={signIn}>
        <Chrome className="h-4 w-4" />
        Sign in with Google
      </Button>
    </section>
  );
}
