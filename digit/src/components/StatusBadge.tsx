import type { TaskStatus } from "@/lib/types";

export const STATUS_META: Record<
  TaskStatus,
  { label: string; classes: string; dot: string }
> = {
  submitted: {
    label: "Submitted",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  broadcasted: {
    label: "Broadcasting",
    classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  accepted: {
    label: "Claimed",
    classes: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  en_route: {
    label: "En route",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  arrived: {
    label: "On site",
    classes: "bg-violet-50 text-violet-700 border-violet-200",
    dot: "bg-violet-500",
  },
  in_progress: {
    label: "Working",
    classes: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  completed_pending: {
    label: "Awaiting your approval",
    classes: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  completed_customer_approved: {
    label: "Approved · closing",
    classes: "bg-teal-50 text-teal-700 border-teal-200",
    dot: "bg-teal-500",
  },
  invoiced: {
    label: "Invoiced",
    classes: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dot: "bg-cyan-500",
  },
  paid: {
    label: "Resolved",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.submitted;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider rounded-full border px-2.5 py-1 ${meta.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
