"use client";

import { cn } from "@/lib/utils";

export function FormMessage({ ok, message }: { ok?: boolean; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p className={cn("rounded-md border px-3 py-2 text-sm", ok ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200" : "border-red-500/25 bg-red-500/10 text-red-200")}>
      {message}
    </p>
  );
}
