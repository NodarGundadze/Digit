"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  PlayCircle,
  TrendingUp,
} from "lucide-react";
import type { TaskDTO } from "@/lib/types";
import { money } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionButton } from "@/components/ActionButton";
import { RaiseDisputeButton } from "@/components/RaiseDisputeButton";
import MapMockup from "@/components/MapMockup";
import {
  finishJob,
  markArrived,
  markEnRoute,
  requestScopeChange,
  startJob,
} from "@/lib/actions/tasks";

// Stages the specialist manually advances through once a job is claimed.
const ACTIVE_STATUSES = ["accepted", "en_route", "arrived", "in_progress"] as const;

export default function ActiveJobCard({
  task,
  workerLocation,
}: {
  task: TaskDTO;
  workerLocation?: { lat: number; lng: number } | null;
}) {
  const [showScope, setShowScope] = useState(false);

  const techPos =
    workerLocation ?? {
      lat: task.location.lat - 0.02,
      lng: task.location.lng - 0.02,
    };

  const isActive = (ACTIVE_STATUSES as readonly string[]).includes(task.status);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <StatusBadge status={task.status} />
          <h3 className="font-semibold text-slate-800 mt-1.5">{task.title}</h3>
        </div>
        <span className="font-bold text-slate-800">{money(task.price)}</span>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {task.location.address}
        </span>
        <span className="flex items-center gap-1">
          <Phone className="w-3.5 h-3.5" /> {task.customerName}
          {task.customerPhone ? ` · ${task.customerPhone}` : ""}
        </span>
      </div>

      <MapMockup
        customer={task.location}
        tech={techPos}
        address={task.location.address}
      />

      {task.scopeRequest && task.scopeRequest.status !== "approved" && (
        <div className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
          Price readjustment {money(task.scopeRequest.requestedNewPrice)} —{" "}
          <span className="font-semibold">
            {task.scopeRequest.status.replace("_", " ")}
          </span>
        </div>
      )}

      {isActive && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <StageButton task={task} />
            <button
              type="button"
              onClick={() => setShowScope((s) => !s)}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 text-xs font-semibold rounded-lg px-3 py-2"
            >
              <TrendingUp className="w-4 h-4" /> Request price readjustment
            </button>
          </div>
          {showScope && (
            <ScopeForm taskId={task.id} onDone={() => setShowScope(false)} />
          )}
        </div>
      )}

      {(task.status === "completed_pending" ||
        task.status === "completed_customer_approved" ||
        task.status === "invoiced") && (
        <p className="text-xs text-slate-500">
          Work submitted — awaiting customer approval and invoicing.
        </p>
      )}

      <div className="flex justify-start pt-1">
        <RaiseDisputeButton taskId={task.id} disputeStatus={task.disputeStatus} />
      </div>
    </div>
  );
}

// The single primary action that advances the job to its next stage.
function StageButton({ task }: { task: TaskDTO }) {
  switch (task.status) {
    case "accepted":
      return (
        <ActionButton
          action={() => markEnRoute(task.id)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-3 py-2"
        >
          <Navigation className="w-4 h-4" /> Set off (en route)
        </ActionButton>
      );
    case "en_route":
      return (
        <ActionButton
          action={() => markArrived(task.id)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-3 py-2"
        >
          <MapPin className="w-4 h-4" /> Mark arrived on site
        </ActionButton>
      );
    case "arrived":
      return (
        <ActionButton
          action={() => startJob(task.id)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-3 py-2"
        >
          <PlayCircle className="w-4 h-4" /> Start work
        </ActionButton>
      );
    case "in_progress":
      return (
        <ActionButton
          action={() => finishJob(task.id)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-3 py-2"
        >
          <CheckCircle2 className="w-4 h-4" /> Mark finished
        </ActionButton>
      );
    default:
      return null;
  }
}

function ScopeForm({
  taskId,
  onDone,
}: {
  taskId: string;
  onDone: () => void;
}) {
  const [price, setPrice] = useState<number | "">("");
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    if (!price || Number(price) <= 0) return setError("Enter a valid price.");
    if (!reason.trim()) return setError("Provide a reason.");
    setPending(true);
    const r = await requestScopeChange(taskId, Number(price), time, reason);
    setPending(false);
    if (!r.ok) setError(r.error || "Failed");
    else onDone();
  };

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-2">
      <p className="text-xs text-slate-600">
        Sent to a manager for review before reaching the customer.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) =>
            setPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="New price ($)"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="Extra time (e.g. 2h)"
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="Why is a price readjustment needed?"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit request
      </button>
    </div>
  );
}
