"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import type { ActionResult } from "@/lib/types";

export function ActionButton({
  action,
  children,
  className = "",
  confirm,
  title,
  onDone,
}: {
  action: () => Promise<ActionResult>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  title?: string;
  onDone?: () => void;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        title={title}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          setErr(null);
          start(async () => {
            const r = await action();
            if (!r.ok) setErr(r.error || "Action failed");
            else onDone?.();
          });
        }}
        className={`inline-flex items-center justify-center gap-1.5 disabled:opacity-60 ${className}`}
      >
        {pending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
      {err && <span className="text-[11px] text-red-600 mt-1">{err}</span>}
    </span>
  );
}
