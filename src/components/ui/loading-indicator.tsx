
"use client";

import { Logo } from "@/components/icons";
import { cn } from "@/lib/utils";

export function LoadingIndicator() {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <div className="absolute h-full w-full animate-spin rounded-full border-4 border-dashed border-primary" />
        <Logo className="h-10 w-10 text-primary animate-pulse" />
      </div>
      <p className="mt-4 text-lg font-semibold text-primary">Loading...</p>
    </div>
  );
}
