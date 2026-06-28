"use client";

import { useState } from "react";
import {
  Briefcase,
  History,
  Inbox,
  MapPin,
  HandCoins,
} from "lucide-react";
import type { TaskDTO, WorkerLevel, VetStatus } from "@/lib/types";
import { money, timeAgo } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { ActionButton } from "@/components/ActionButton";
import { RatingStars } from "@/components/RatingStars";
import { acceptTask } from "@/lib/actions/tasks";
import ActiveJobCard from "./ActiveJobCard";
import ManagerPanel from "./ManagerPanel";

interface Me {
  id: string;
  name: string;
  vetStatus: VetStatus;
  level: WorkerLevel;
  tags: string[];
  location?: { lat: number; lng: number } | null;
}

type Tab = "queue" | "active" | "history";

export default function WorkerDashboard({
  me,
  queue,
  myTasks,
  commissionPct,
  managerData,
}: {
  me: Me;
  queue: TaskDTO[];
  myTasks: TaskDTO[];
  commissionPct: number;
  managerData?: { tasks: TaskDTO[]; skillTags: string[]; alarmMinutes: number };
}) {
  const isManager = me.level === "manager" && !!managerData;
  const [tab, setTab] = useState<Tab>("queue");

  const matching = queue.filter((t) =>
    t.tags.some((tag) => me.tags.includes(tag))
  );

  const active = myTasks.filter((t) => t.status !== "paid");
  const history = myTasks.filter((t) => t.status === "paid");
  const earnings = history.reduce(
    (sum, t) => sum + t.price * (1 - commissionPct / 100),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isManager ? "Operations & specialist portal" : "Specialist portal"}
          </h1>
          <p className="text-sm text-slate-500">
            {me.tags.join(" · ") || "No skills set"}
          </p>
        </div>
        {!isManager && (
          <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
            <TabBtn active={tab === "queue"} onClick={() => setTab("queue")}>
              <Inbox className="w-4 h-4" /> Queue
              {matching.length > 0 && <Count n={matching.length} />}
            </TabBtn>
            <TabBtn active={tab === "active"} onClick={() => setTab("active")}>
              <Briefcase className="w-4 h-4" /> Active
              {active.length > 0 && <Count n={active.length} />}
            </TabBtn>
            <TabBtn active={tab === "history"} onClick={() => setTab("history")}>
              <History className="w-4 h-4" /> History
            </TabBtn>
          </div>
        )}
      </div>

      {isManager && managerData && (
        <ManagerPanel
          tasks={managerData.tasks}
          skillTags={managerData.skillTags}
          alarmMinutes={managerData.alarmMinutes}
        />
      )}

      {!isManager && tab === "queue" && (
        <div className="space-y-4">
          {matching.length === 0 ? (
            <Empty label="No broadcast jobs right now. Check back soon." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {matching.map((t) => (
                <QueueCard key={t.id} task={t} matched />
              ))}
            </div>
          )}
        </div>
      )}

      {!isManager && tab === "active" && (
        <div className="space-y-4">
          {active.length === 0 ? (
            <Empty label="No active jobs. Claim one from the queue." />
          ) : (
            active.map((t) => (
              <ActiveJobCard key={t.id} task={t} workerLocation={me.location} />
            ))
          )}
        </div>
      )}

      {!isManager && tab === "history" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center justify-between">
            <span className="text-sm text-slate-500 flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-emerald-500" /> Lifetime net
              earnings ({commissionPct}% platform fee)
            </span>
            <span className="text-xl font-bold text-emerald-600">
              {money(earnings)}
            </span>
          </div>
          {history.length === 0 ? (
            <Empty label="No completed jobs yet." />
          ) : (
            history.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-400">{timeAgo(t.createdAt)}</p>
                </div>
                <div className="text-right">
                  {t.rating ? (
                    <RatingStars value={t.rating} size="w-4 h-4" />
                  ) : null}
                  <p className="text-sm font-bold text-emerald-600 mt-1">
                    +{money(t.price * (1 - commissionPct / 100))}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function QueueCard({ task, matched }: { task: TaskDTO; matched?: boolean }) {
  return (
    <div
      className={`bg-white border rounded-2xl shadow-sm p-4 space-y-3 ${
        matched ? "border-indigo-200" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={task.status} />
        <span className="font-bold text-slate-800">{money(task.price)}</span>
      </div>
      <h3 className="font-semibold text-slate-800">{task.title}</h3>
      <p className="text-xs text-slate-500 line-clamp-3">{task.description}</p>
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
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> {task.location.address}
        </span>
        <ActionButton
          action={() => acceptTask(task.id)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-3 py-2"
        >
          Claim job
        </ActionButton>
      </div>
    </div>
  );
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
        active ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function Count({ n }: { n: number }) {
  return (
    <span className="ml-1 text-[10px] bg-white/20 rounded-full px-1.5 py-0.5">
      {n}
    </span>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-sm text-slate-400">
      {label}
    </div>
  );
}
