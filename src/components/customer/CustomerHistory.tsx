"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Receipt, Star } from "lucide-react";
import type { TaskDTO } from "@/lib/types";
import { money, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskTimeline } from "@/components/TaskTimeline";
import { RatingStars } from "@/components/RatingStars";
import { RaiseDisputeButton } from "@/components/RaiseDisputeButton";

// Timestamp a task was settled (its `paid` log), used to sort history newest-first.
function settledAt(task: TaskDTO): number {
  const paidLog = task.logs.find((l) => l.status === "paid");
  return new Date(paidLog?.timestamp ?? task.createdAt).getTime();
}

export default function CustomerHistory({ tasks }: { tasks: TaskDTO[] }) {
  const history = [...tasks].sort((a, b) => settledAt(b) - settledAt(a));

  if (history.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
        No resolved requests in your history yet.
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold text-slate-600">
        Resolved request history ({history.length})
      </h2>
      <div className="space-y-3">
        {history.map((t) => (
          <HistoryCard key={t.id} task={t} />
        ))}
      </div>
    </section>
  );
}

function HistoryCard({ task }: { task: TaskDTO }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50/60"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={task.status} />
            <span className="text-[11px] text-slate-400 font-mono">
              {timeAgo(task.createdAt)}
            </span>
          </div>
          <h3 className="font-semibold text-slate-800 mt-1.5 truncate">
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-bold text-slate-800">{money(task.price)}</span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4">
          <Section icon={<FileText className="w-4 h-4 text-slate-400" />} title="Problem description">
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
              {task.description}
            </p>
          </Section>

          {task.assignedTechnicianName && (
            <p className="text-xs text-slate-500">
              Resolved by{" "}
              <span className="font-semibold text-slate-700">
                {task.assignedTechnicianName}
              </span>
            </p>
          )}

          <PriceBreakdown task={task} />

          {task.rating != null && (
            <Section icon={<Star className="w-4 h-4 text-amber-400" />} title="Your rating & review">
              <RatingStars value={task.rating} size="w-4 h-4" />
              {task.feedback && (
                <p className="text-xs text-slate-600 mt-1.5 italic">“{task.feedback}”</p>
              )}
            </Section>
          )}

          <div className="flex justify-start">
            <RaiseDisputeButton taskId={task.id} disputeStatus={task.disputeStatus} />
          </div>

          <details className="group">
            <summary className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
              Activity audit trail ({task.logs.length})
            </summary>
            <div className="mt-3">
              <TaskTimeline logs={task.logs} />
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

function PriceBreakdown({ task }: { task: TaskDTO }) {
  const original = task.originalPrice ?? task.price;
  const scope = task.scopeRequest;
  const adjusted = scope?.status === "approved";
  const delta = adjusted ? scope.requestedNewPrice - original : 0;

  return (
    <Section
      icon={<Receipt className="w-4 h-4 text-slate-400" />}
      title="Price & adjustment breakdown"
    >
      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
        <Row label="Original quote" value={money(original)} />
        <Row
          label="Scope adjustment"
          value={adjusted ? `+${money(delta)} (approved)` : "No adjustments"}
          tone={adjusted ? "text-amber-700" : "text-slate-400"}
        />
        <Row label="Final paid" value={money(task.price)} bold />
      </div>
      {adjusted && scope.reason && (
        <p className="text-[11px] text-slate-500 mt-2 italic leading-relaxed">
          <span className="font-semibold not-italic text-slate-600">Adjustment reason:</span>{" "}
          “{scope.reason}”
        </p>
      )}
    </Section>
  );
}

function Row({
  label,
  value,
  tone = "text-slate-700",
  bold,
}: {
  label: string;
  value: string;
  tone?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <span className="text-slate-500">{label}</span>
      <span className={`font-mono ${bold ? "font-bold text-slate-800" : `font-semibold ${tone}`}`}>
        {value}
      </span>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
        {icon} {title}
      </h4>
      {children}
    </div>
  );
}
