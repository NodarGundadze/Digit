"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  ListChecks,
  PlusCircle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Bell,
  Loader2,
  History,
} from "lucide-react";
import type { LocationDTO, TaskDTO } from "@/lib/types";
import { money, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskTimeline } from "@/components/TaskTimeline";
import { ActionButton } from "@/components/ActionButton";
import { RatingStars } from "@/components/RatingStars";
import MapMockup from "@/components/MapMockup";
import { RaiseDisputeButton } from "@/components/RaiseDisputeButton";
import NewOutageForm from "./NewOutageForm";
import CustomerHistory from "./CustomerHistory";
import {
  approveFinishedJob,
  approveInitialPrice,
  approveScopeChange,
  payInvoice,
  rejectInitialPrice,
  rejectScopeChange,
} from "@/lib/actions/tasks";

function needsAction(t: TaskDTO): boolean {
  return (
    (t.status === "submitted" && t.initialPriceStatus === "pending_approval") ||
    t.scopeRequest?.status === "pending_client" ||
    t.status === "completed_pending" ||
    t.status === "invoiced"
  );
}

export default function CustomerDashboard({
  tasks,
  skillTags,
  locationPresets,
  maxImageSizeMb,
}: {
  tasks: TaskDTO[];
  skillTags: string[];
  locationPresets: LocationDTO[];
  maxImageSizeMb: number;
}) {
  const [tab, setTab] = useState<"requests" | "history" | "new">("requests");

  const actionable = tasks.filter(needsAction);
  const active = tasks.filter((t) => t.status !== "paid" && !needsAction(t));
  const resolved = tasks.filter((t) => t.status === "paid");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Your requests</h1>
          <p className="text-sm text-slate-500">
            Track outages and approve quotes, scope changes, and invoices.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <TabBtn active={tab === "requests"} onClick={() => setTab("requests")}>
            <ListChecks className="w-4 h-4" /> My requests
          </TabBtn>
          <TabBtn active={tab === "history"} onClick={() => setTab("history")}>
            <History className="w-4 h-4" /> History ({resolved.length})
          </TabBtn>
          <TabBtn active={tab === "new"} onClick={() => setTab("new")}>
            <PlusCircle className="w-4 h-4" /> File new outage
          </TabBtn>
        </div>
      </div>

      {tab === "new" ? (
        <NewOutageForm
          skillTags={skillTags}
          locationPresets={locationPresets}
          maxImageSizeMb={maxImageSizeMb}
          onCreated={() => setTab("requests")}
        />
      ) : tab === "history" ? (
        <CustomerHistory tasks={resolved} />
      ) : (
        <div className="space-y-6">
          {actionable.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-amber-700 flex items-center gap-1.5">
                <Bell className="w-4 h-4" /> Needs your attention (
                {actionable.length})
              </h2>
              <div className="space-y-3">
                {actionable.map((t) => (
                  <TaskCard key={t.id} task={t} highlight defaultOpen />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-slate-600">
              Active requests ({active.length})
            </h2>
            {active.length === 0 ? (
              <Empty label="No active requests. File a new outage to get started." />
            ) : (
              <div className="space-y-3">
                {active.map((t) => (
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  highlight,
  defaultOpen,
}: {
  task: TaskDTO;
  highlight?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const showMap =
    !!task.assignedTechnicianId &&
    ["accepted", "en_route", "arrived", "in_progress"].includes(task.status);
  const techPos = task.routeHistory.length
    ? task.routeHistory[task.routeHistory.length - 1]
    : null;

  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${
        highlight ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200"
      }`}
    >
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
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {task.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {task.tags.map((t) => (
              <span
                key={t}
                className="text-[11px] bg-slate-100 text-slate-600 rounded-full px-2 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>

          {task.assignedTechnicianName && (
            <p className="text-xs text-slate-500">
              Specialist:{" "}
              <span className="font-semibold text-slate-700">
                {task.assignedTechnicianName}
              </span>
              {task.assignedTechnicianPhone
                ? ` · ${task.assignedTechnicianPhone}`
                : ""}
            </p>
          )}

          {showMap && (
            <MapMockup
              customer={task.location}
              route={task.routeHistory}
              tech={techPos}
              address={task.location.address}
            />
          )}

          <ActionPanel task={task} />

          {(task.assignedTechnicianId ||
            task.status === "invoiced" ||
            task.status === "paid") && (
            <div className="flex justify-start">
              <RaiseDisputeButton
                taskId={task.id}
                disputeStatus={task.disputeStatus}
              />
            </div>
          )}

          <details className="group">
            <summary className="text-xs font-semibold text-slate-500 cursor-pointer select-none">
              Activity log ({task.logs.length})
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

function ActionPanel({ task }: { task: TaskDTO }) {
  // Price proposal awaiting approval
  if (task.status === "submitted" && task.initialPriceStatus === "pending_approval") {
    return (
      <Panel tone="amber">
        <p className="text-sm font-semibold text-slate-800">
          Manager proposed {money(task.price)}
        </p>
        {task.initialPriceReason && (
          <p className="text-xs text-slate-600 mt-1">
            “{task.initialPriceReason}”
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <ActionButton
            action={() => approveInitialPrice(task.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 py-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve price
          </ActionButton>
          <ActionButton
            action={() => rejectInitialPrice(task.id)}
            className="bg-white border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg px-3 py-2"
          >
            <XCircle className="w-4 h-4" /> Decline
          </ActionButton>
        </div>
      </Panel>
    );
  }

  // Scope change awaiting client sign-off
  if (task.scopeRequest?.status === "pending_client") {
    const sr = task.scopeRequest;
    return (
      <Panel tone="amber">
        <p className="text-sm font-semibold text-slate-800">
          Scope readjustment: {money(sr.requestedNewPrice)}
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Extra time: {sr.requestedNewTime || "n/a"} · {sr.reason}
        </p>
        <div className="flex gap-2 mt-3">
          <ActionButton
            action={() => approveScopeChange(task.id)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 py-2"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve new price
          </ActionButton>
          <ActionButton
            action={() => rejectScopeChange(task.id)}
            className="bg-white border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg px-3 py-2"
          >
            <XCircle className="w-4 h-4" /> Decline
          </ActionButton>
        </div>
      </Panel>
    );
  }

  // Job finished, awaiting customer rating/approval
  if (task.status === "completed_pending") {
    return <ApproveFinishedForm taskId={task.id} />;
  }

  // Invoice awaiting payment
  if (task.status === "invoiced") {
    return (
      <Panel tone="cyan">
        <p className="text-sm font-semibold text-slate-800">
          Final invoice: {money(task.price)}
        </p>
        <div className="mt-3">
          <ActionButton
            action={() => payInvoice(task.id)}
            confirm={`Pay ${money(task.price)} and close this ticket?`}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-3 py-2"
          >
            <CreditCard className="w-4 h-4" /> Pay invoice
          </ActionButton>
        </div>
      </Panel>
    );
  }

  if (task.status === "paid") {
    return (
      <Panel tone="emerald">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-emerald-700">
            Resolved & settled
          </p>
          {task.rating ? <RatingStars value={task.rating} size="w-4 h-4" /> : null}
        </div>
        {task.feedback && (
          <p className="text-xs text-slate-600 mt-1">“{task.feedback}”</p>
        )}
      </Panel>
    );
  }

  return null;
}

function ApproveFinishedForm({ taskId }: { taskId: string }) {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <Panel tone="orange">
      <p className="text-sm font-semibold text-slate-800">
        The specialist marked this complete. Rate & approve the fix.
      </p>
      <div className="mt-2">
        <RatingStars value={rating} onChange={setRating} />
      </div>
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={2}
        placeholder="Optional feedback…"
        className="w-full mt-2 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const r = await approveFinishedJob(taskId, rating, feedback);
            if (!r.ok) setError(r.error || "Failed");
          });
        }}
        className="mt-3 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
        Approve & rate
      </button>
    </Panel>
  );
}

function Panel({
  tone,
  children,
}: {
  tone: "amber" | "cyan" | "emerald" | "orange";
  children: React.ReactNode;
}) {
  const map = {
    amber: "bg-amber-50 border-amber-200",
    cyan: "bg-cyan-50 border-cyan-200",
    emerald: "bg-emerald-50 border-emerald-200",
    orange: "bg-orange-50 border-orange-200",
  };
  return <div className={`rounded-xl border p-3.5 ${map[tone]}`}>{children}</div>;
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ${
        active
          ? "bg-indigo-600 text-white"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}
