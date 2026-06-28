"use client";

import { useState } from "react";
import {
  AlarmClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Megaphone,
  Send,
  ThumbsDown,
} from "lucide-react";
import type { TaskDTO } from "@/lib/types";
import { money, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionButton } from "@/components/ActionButton";
import { TaskTimeline } from "@/components/TaskTimeline";
import {
  broadcastTask,
  finalizeAndCloseJob,
  issueInvoice,
  proposeInitialPrice,
  reviewScopeChange,
} from "@/lib/actions/tasks";

function unclaimedMinutes(t: TaskDTO): number {
  const since = new Date(t.broadcastedAt ?? t.createdAt).getTime();
  return Math.floor((Date.now() - since) / 60_000);
}

function alarmed(t: TaskDTO, mins: number): boolean {
  if (t.status !== "broadcasted" || t.assignedTechnicianId) return false;
  return unclaimedMinutes(t) > mins;
}

export default function ManagerPanel({
  tasks,
  skillTags,
  alarmMinutes,
}: {
  tasks: TaskDTO[];
  skillTags: string[];
  alarmMinutes: number;
}) {
  const needsPricing = tasks.filter(
    (t) =>
      t.status === "submitted" &&
      (t.initialPriceStatus == null || t.initialPriceStatus === "rejected")
  );
  const awaitingCustomer = tasks.filter(
    (t) => t.status === "submitted" && t.initialPriceStatus === "pending_approval"
  );
  const readyToBroadcast = tasks.filter(
    (t) => t.status === "submitted" && t.initialPriceStatus === "approved"
  );
  const scopeReviews = tasks.filter(
    (t) => t.scopeRequest?.status === "pending_manager"
  );
  const completion = tasks.filter(
    (t) => t.status === "completed_customer_approved"
  );
  const alarms = tasks.filter((t) => alarmed(t, alarmMinutes));
  const inFlight = tasks.filter((t) =>
    [
      "broadcasted",
      "accepted",
      "en_route",
      "arrived",
      "in_progress",
      "completed_pending",
      "invoiced",
    ].includes(t.status)
  );

  const [stateFilter, setStateFilter] = useState<string>("all");

  // Pill-bar filter over the workflow groups. Alarms only appears when present.
  const filters: { key: string; label: string; count: number }[] = [
    ...(alarms.length
      ? [{ key: "alarms", label: "Alarms", count: alarms.length }]
      : []),
    { key: "needs-pricing", label: "Needs pricing", count: needsPricing.length },
    { key: "awaiting", label: "Awaiting approval", count: awaitingCustomer.length },
    { key: "ready", label: "Ready to broadcast", count: readyToBroadcast.length },
    { key: "scope", label: "Scope reviews", count: scopeReviews.length },
    { key: "completion", label: "Completion review", count: completion.length },
    { key: "inflight", label: "In flight", count: inFlight.length },
  ];
  const show = (key: string) => stateFilter === "all" || stateFilter === key;

  return (
    <div className="space-y-6">
      <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        <FilterPill
          active={stateFilter === "all"}
          onClick={() => setStateFilter("all")}
        >
          All
        </FilterPill>
        {filters.map((f) => (
          <FilterPill
            key={f.key}
            active={stateFilter === f.key}
            onClick={() => setStateFilter(f.key)}
          >
            {f.label} ({f.count})
          </FilterPill>
        ))}
      </div>

      {alarms.length > 0 && show("alarms") && (
        <Group
          title="Unclaimed alarms"
          count={alarms.length}
          icon={<AlarmClock className="w-4 h-4" />}
          tone="text-red-600"
        >
          {alarms.map((t) => (
            <Row key={t.id} task={t}>
              <span className="text-xs text-red-600 font-semibold">
                Unclaimed for {unclaimedMinutes(t)}m (threshold {alarmMinutes}m)
              </span>
            </Row>
          ))}
        </Group>
      )}

      {show("needs-pricing") && (
      <Group
        title="Needs pricing"
        count={needsPricing.length}
        icon={<FileText className="w-4 h-4" />}
      >
        {needsPricing.length === 0 ? (
          <Empty label="Nothing to price right now." />
        ) : (
          needsPricing.map((t) => (
            <Row key={t.id} task={t}>
              <ProposeForm task={t} skillTags={skillTags} />
            </Row>
          ))
        )}
      </Group>
      )}

      {show("awaiting") && (
      <Group
        title="Awaiting customer approval"
        count={awaitingCustomer.length}
        icon={<Send className="w-4 h-4" />}
      >
        {awaitingCustomer.length === 0 ? (
          <Empty label="No proposals awaiting a customer decision." />
        ) : (
          awaitingCustomer.map((t) => (
            <Row key={t.id} task={t}>
              <p className="text-xs text-slate-500">
                Proposed {money(t.price)} — waiting on {t.customerName} to approve
                or decline.
              </p>
              {t.initialPriceReason && (
                <p className="text-[11px] text-slate-400 mt-1">
                  “{t.initialPriceReason}”
                </p>
              )}
            </Row>
          ))
        )}
      </Group>
      )}

      {show("ready") && (
      <Group
        title="Ready to broadcast"
        count={readyToBroadcast.length}
        icon={<Megaphone className="w-4 h-4" />}
      >
        {readyToBroadcast.length === 0 ? (
          <Empty label="No approved tickets waiting to send." />
        ) : (
          readyToBroadcast.map((t) => (
            <Row key={t.id} task={t}>
              <p className="text-xs text-slate-600">
                Customer approved {money(t.price)} — ready to send to specialists
                matching: {t.tags.join(", ") || "n/a"}.
              </p>
              <div className="mt-2">
                <ActionButton
                  action={() => broadcastTask(t.id, t.tags)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5"
                >
                  <Megaphone className="w-3.5 h-3.5" /> Broadcast
                </ActionButton>
              </div>
            </Row>
          ))
        )}
      </Group>
      )}

      {show("scope") && (
      <Group
        title="Scope reviews"
        count={scopeReviews.length}
        icon={<Send className="w-4 h-4" />}
      >
        {scopeReviews.length === 0 ? (
          <Empty label="No scope requests awaiting review." />
        ) : (
          scopeReviews.map((t) => (
            <Row key={t.id} task={t}>
              <div className="text-xs text-slate-600">
                Proposed {money(t.scopeRequest!.requestedNewPrice)} · extra{" "}
                {t.scopeRequest!.requestedNewTime || "n/a"} — {t.scopeRequest!.reason}
              </div>
              <div className="flex gap-2 mt-2">
                <ActionButton
                  action={() => reviewScopeChange(t.id, "forward")}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 py-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Forward to customer
                </ActionButton>
                <ActionButton
                  action={() => reviewScopeChange(t.id, "reject")}
                  className="bg-white border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg px-3 py-1.5"
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </ActionButton>
              </div>
            </Row>
          ))
        )}
      </Group>
      )}

      {show("completion") && (
      <Group
        title="Completion review"
        count={completion.length}
        icon={<CheckCircle2 className="w-4 h-4" />}
      >
        {completion.length === 0 ? (
          <Empty label="No jobs awaiting closure." />
        ) : (
          completion.map((t) => (
            <Row key={t.id} task={t}>
              {t.rating ? (
                <p className="text-xs text-slate-600">
                  Customer rated {t.rating}★ — “{t.feedback || "No comment"}”
                </p>
              ) : null}
              <div className="mt-2">
                <InvoiceForm task={t} />
              </div>
            </Row>
          ))
        )}
      </Group>
      )}

      {show("inflight") && (
      <Group
        title="In flight"
        count={inFlight.length}
        icon={<Megaphone className="w-4 h-4" />}
      >
        {inFlight.length === 0 ? (
          <Empty label="No active jobs." />
        ) : (
          inFlight.map((t) => (
            <Row key={t.id} task={t}>
              <span className="text-xs text-slate-500">
                {t.assignedTechnicianName
                  ? `Specialist: ${t.assignedTechnicianName}`
                  : "Awaiting a specialist to accept"}
              </span>
            </Row>
          ))
        )}
      </Group>
      )}
    </div>
  );
}

function ProposeForm({
  task,
  skillTags,
}: {
  task: TaskDTO;
  skillTags: string[];
}) {
  const [price, setPrice] = useState<number | "">(task.price || "");
  const [tags, setTags] = useState<string[]>(task.tags);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const toggle = (t: string) =>
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  // Did the manager move off the customer's own budget? If not, there is nothing
  // for the customer to approve — we broadcast straight away, no confirm.
  const priceChanged = price !== "" && Number(price) !== task.originalPrice;

  const valid = () => {
    if (!price || Number(price) <= 0) {
      setError("Enter a price.");
      return false;
    }
    if (!tags.length) {
      setError("Pick at least one tag.");
      return false;
    }
    return true;
  };

  const propose = async () => {
    setError(null);
    if (!valid()) return;
    if (!reason.trim()) return setError("Add a comment explaining the new price.");
    setPending(true);
    const r = await proposeInitialPrice(task.id, Number(price), tags, reason);
    setPending(false);
    if (!r.ok) setError(r.error || "Failed");
  };

  const broadcast = async () => {
    setError(null);
    if (!valid()) return;
    setPending(true);
    const r = await broadcastTask(task.id, tags, Number(price));
    setPending(false);
    if (!r.ok) setError(r.error || "Failed");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {skillTags.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={`text-[11px] rounded-lg px-2 py-1 border transition-colors ${
              tags.includes(t)
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="Price ($)"
          className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            priceChanged ? "Comment: why the new price?" : "Pricing note (optional)"
          }
          className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <p className="text-[11px] text-slate-400">
        {priceChanged
          ? `Differs from the customer's ${money(task.originalPrice ?? task.price)} budget — they must approve before it broadcasts.`
          : "Matches the customer's budget — broadcasts directly, no approval needed."}
      </p>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        {priceChanged ? (
          <button
            type="button"
            onClick={propose}
            disabled={pending}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Send className="w-3.5 h-3.5" /> Propose to customer
          </button>
        ) : (
          <button
            type="button"
            onClick={broadcast}
            disabled={pending}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2"
          >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            <Megaphone className="w-3.5 h-3.5" /> Broadcast
          </button>
        )}
      </div>
    </div>
  );
}

function InvoiceForm({ task }: { task: TaskDTO }) {
  const [price, setPrice] = useState<number>(task.price);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const invoice = async () => {
    setError(null);
    if (!price || price <= 0) return setError("Enter an amount.");
    setPending(true);
    const r = await issueInvoice(task.id, price);
    setPending(false);
    if (!r.ok) setError(r.error || "Failed");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button
        type="button"
        onClick={invoice}
        disabled={pending}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        <FileText className="w-3.5 h-3.5" /> Issue invoice
      </button>
      <ActionButton
        action={() => finalizeAndCloseJob(task.id)}
        confirm="Close this ticket without a separate invoice step?"
        className="bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 text-xs font-semibold rounded-lg px-3 py-2"
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Finalize & close
      </ActionButton>
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}

function Group({
  title,
  count,
  icon,
  tone = "text-slate-600",
  children,
}: {
  title: string;
  count: number;
  icon: React.ReactNode;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className={`text-sm font-bold flex items-center gap-1.5 ${tone}`}>
        {icon} {title} ({count})
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-start">
        {children}
      </div>
    </section>
  );
}

function FilterPill({
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
      className={`text-sm font-semibold rounded-lg px-3 py-1.5 transition-colors ${
        active ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

// Collapsed: just the problem, price, and (once claimed) the specialist.
// Expanded: the full ticket detail + the complete activity timeline.
function Row({
  task,
  children,
}: {
  task: TaskDTO;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const priceChanged =
    task.originalPrice != null && task.originalPrice !== task.price;

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
              {task.customerName} · {timeAgo(task.createdAt)}
            </span>
          </div>
          <h3 className="font-semibold text-slate-800 mt-1.5 truncate">
            {task.title}
          </h3>
          {task.assignedTechnicianName && (
            <p className="text-[11px] text-slate-500 mt-0.5">
              Specialist: {task.assignedTechnicianName}
            </p>
          )}
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

      <div className="px-4 pb-4 space-y-2">{children}</div>

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

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <Detail label="Customer">
              {task.customerName}
              {task.customerPhone ? ` · ${task.customerPhone}` : ""}
            </Detail>
            <Detail label="Specialist">
              {task.assignedTechnicianName ?? "Unassigned"}
            </Detail>
            <Detail label="Price">
              {money(task.price)}
              {priceChanged ? ` (budget ${money(task.originalPrice!)})` : ""}
            </Detail>
            <Detail label="Location">{task.location.address}</Detail>
          </dl>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">
              Activity log ({task.logs.length})
            </p>
            <TaskTimeline logs={task.logs} />
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-700 truncate">{children}</dd>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="col-span-full bg-white border border-dashed border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-400">
      {label}
    </div>
  );
}
