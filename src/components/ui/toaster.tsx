"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

function ToastViewport() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] grid w-[min(22rem,calc(100vw-2rem))] gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-md border bg-card p-4 pr-11 text-sm shadow-lg",
            toast.variant === "destructive" && "border-destructive/30 bg-destructive/10 text-foreground"
          )}
        >
          <div className="font-semibold">{toast.title}</div>
          {toast.description ? <div className="mt-1 text-muted-foreground">{toast.description}</div> : null}
          <Button
            aria-label="Dismiss toast"
            className="absolute right-2 top-2 h-7 w-7"
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => dismiss(toast.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export function Toaster() {
  return <ToastViewport />;
}
