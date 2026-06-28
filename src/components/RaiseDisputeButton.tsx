"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, ShieldAlert, X } from "lucide-react";
import type { DisputeStatus } from "@/lib/types";
import { raiseDispute } from "@/lib/actions/tasks";

// Shared "Raise a dispute" control used by the customer and specialist task
// views. If a dispute is already open on the task it shows a muted status badge
// instead of the form, preventing duplicates.
export function RaiseDisputeButton({
  taskId,
  disputeStatus,
}: {
  taskId: string;
  disputeStatus?: DisputeStatus | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (disputeStatus === "open") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
        <ShieldAlert className="w-3.5 h-3.5" /> Dispute under review
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg px-2.5 py-1.5"
      >
        <AlertTriangle className="w-3.5 h-3.5" /> Raise a dispute
      </button>
    );
  }

  const submit = () => {
    setError(null);
    start(async () => {
      const r = await raiseDispute(taskId, reason);
      if (!r.ok) {
        setError(r.error || "Failed to raise dispute.");
        return;
      }
      setReason("");
      setOpen(false);
    });
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5 space-y-2 w-full">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Raise a dispute
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Describe what's wrong — billing, quality, conduct… An admin will review it."
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit dispute
      </button>
    </div>
  );
}
