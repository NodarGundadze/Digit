"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlarmClock,
  BarChart3,
  Settings as SettingsIcon,
  Users as UsersIcon,
  DollarSign,
  Star,
  Loader2,
  Plus,
  X,
  ShieldCheck,
  ShieldX,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  RotateCcw,
  Activity,
  ScrollText,
  Gavel,
  CheckCircle2,
  XCircle,
  Search,
  FileWarning,
} from "lucide-react";
import type { UserDTO, DisputeDTO, DisputeStatus } from "@/lib/types";
import type { AuditEntry } from "@/lib/queries";
import { money, timeAgo, shortDateTime } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { ActionButton } from "@/components/ActionButton";
import {
  adminCreateUser,
  resolveDispute,
  setUserStatus,
  setWorkerLevel,
  updateSettings,
  updateSkillTags,
  vetTechnician,
} from "@/lib/actions/admin";

export interface AdminAnalytics {
  grossRevenue: number;
  commissionEarned: number;
  paidJobs: number;
  totalTasks: number;
  avgRating: number;
  ratedCount: number;
  workersVetted: number;
  workersPending: number;
  managers: number;
  customers: number;
  alarmsCount: number;
  staleSubmitted: number;
  openDisputes: number;
}

export interface AdminSettings {
  commissionPct: number;
  minJobPrice: number;
  unclaimedAlarmMinutes: number;
  managerNoResponseMinutes: number;
  maxImagesPerTicket: number;
  maxImageSizeMb: number;
}

interface AlarmRow {
  id: string;
  title: string;
  customerName: string;
  minutes: number;
}

type Tab = "overview" | "users" | "disputes" | "audit" | "settings";

export default function AdminDashboard({
  selfId,
  users,
  analytics,
  alarms,
  staleTickets,
  settings,
  skillTags,
  disputes,
  audit,
}: {
  selfId: string;
  users: UserDTO[];
  analytics: AdminAnalytics;
  alarms: AlarmRow[];
  staleTickets: AlarmRow[];
  settings: AdminSettings;
  skillTags: string[];
  disputes: DisputeDTO[];
  audit: AuditEntry[];
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const openDisputes = disputes.filter((d) => d.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin console</h1>
          <p className="text-sm text-slate-500">
            Platform oversight, vetting, disputes, settings, and analytics.
          </p>
        </div>
        <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1">
          <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
            <BarChart3 className="w-4 h-4" /> Overview
          </TabBtn>
          <TabBtn active={tab === "users"} onClick={() => setTab("users")}>
            <UsersIcon className="w-4 h-4" /> Users
          </TabBtn>
          <TabBtn active={tab === "disputes"} onClick={() => setTab("disputes")}>
            <Gavel className="w-4 h-4" /> Disputes
            {openDisputes > 0 && (
              <span className="ml-1 text-[10px] font-bold bg-red-100 text-red-700 rounded-full px-1.5 py-0.5">
                {openDisputes}
              </span>
            )}
          </TabBtn>
          <TabBtn active={tab === "audit"} onClick={() => setTab("audit")}>
            <ScrollText className="w-4 h-4" /> Audit log
          </TabBtn>
          <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>
            <SettingsIcon className="w-4 h-4" /> Settings
          </TabBtn>
        </div>
      </div>

      {tab === "overview" && (
        <Overview
          analytics={analytics}
          alarms={alarms}
          staleTickets={staleTickets}
          alarmMinutes={settings.unclaimedAlarmMinutes}
          noResponseMinutes={settings.managerNoResponseMinutes}
          audit={audit}
        />
      )}
      {tab === "users" && <UsersTab selfId={selfId} users={users} skillTags={skillTags} />}
      {tab === "disputes" && <DisputesTab disputes={disputes} />}
      {tab === "audit" && <AuditTab audit={audit} />}
      {tab === "settings" && <SettingsTab settings={settings} skillTags={skillTags} />}
    </div>
  );
}

function Overview({
  analytics,
  alarms,
  staleTickets,
  alarmMinutes,
  noResponseMinutes,
  audit,
}: {
  analytics: AdminAnalytics;
  alarms: AlarmRow[];
  staleTickets: AlarmRow[];
  alarmMinutes: number;
  noResponseMinutes: number;
  audit: AuditEntry[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi
          icon={<DollarSign className="w-4 h-4" />}
          label="Gross revenue"
          value={money(analytics.grossRevenue)}
          tone="text-emerald-600"
        />
        <Kpi
          icon={<DollarSign className="w-4 h-4" />}
          label="Commission earned"
          value={money(analytics.commissionEarned)}
          tone="text-indigo-600"
        />
        <Kpi
          icon={<BarChart3 className="w-4 h-4" />}
          label="Paid jobs"
          value={`${analytics.paidJobs}/${analytics.totalTasks}`}
        />
        <Kpi
          icon={<Star className="w-4 h-4" />}
          label="Avg rating"
          value={analytics.ratedCount ? `${analytics.avgRating.toFixed(1)}★` : "—"}
          tone="text-amber-500"
        />
        <Kpi
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Vetted specialists"
          value={`${analytics.workersVetted}`}
        />
        <Kpi
          icon={<UsersIcon className="w-4 h-4" />}
          label="Managers"
          value={`${analytics.managers}`}
        />
        <Kpi
          icon={<Gavel className="w-4 h-4" />}
          label="Open disputes"
          value={`${analytics.openDisputes}`}
          tone={analytics.openDisputes ? "text-red-600" : undefined}
        />
        <Kpi
          icon={<AlarmClock className="w-4 h-4" />}
          label="Unclaimed alarms"
          value={`${analytics.alarmsCount}`}
          tone={analytics.alarmsCount ? "text-red-600" : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card
          title="Unclaimed-ticket alarms"
          icon={<AlarmClock className="w-4 h-4 text-red-500" />}
        >
          {alarms.length === 0 ? (
            <Empty label={`No tickets unclaimed beyond ${alarmMinutes} minutes.`} />
          ) : (
            <ul className="space-y-2">
              {alarms.map((a) => (
                <AlarmItem key={a.id} row={a} suffix="unclaimed" />
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Manager no-response"
          icon={<FileWarning className="w-4 h-4 text-amber-500" />}
        >
          {staleTickets.length === 0 ? (
            <Empty
              label={`No submitted tickets untouched beyond ${noResponseMinutes} minutes.`}
            />
          ) : (
            <ul className="space-y-2">
              {staleTickets.map((a) => (
                <AlarmItem key={a.id} row={a} suffix="awaiting pricing" tone="amber" />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Activity feed" icon={<Activity className="w-4 h-4 text-indigo-500" />}>
        {audit.length === 0 ? (
          <Empty label="No admin activity yet." />
        ) : (
          <ul className="space-y-2 max-h-72 overflow-auto pr-1">
            {audit.slice(0, 8).map((e) => (
              <li key={e.id} className="text-xs text-slate-600 border-b border-slate-100 pb-2">
                <span className="font-semibold text-slate-700">{e.actorName}</span>{" "}
                {e.detail || e.action}
                <span className="block text-[10px] text-slate-400 font-mono">
                  {timeAgo(e.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function AlarmItem({
  row,
  suffix,
  tone = "red",
}: {
  row: AlarmRow;
  suffix: string;
  tone?: "red" | "amber";
}) {
  const cls =
    tone === "amber"
      ? "border-amber-100 bg-amber-50/50 text-amber-600"
      : "border-red-100 bg-red-50/50 text-red-600";
  return (
    <li
      className={`flex items-center justify-between gap-2 text-sm border rounded-lg px-3 py-2 ${cls}`}
    >
      <span className="min-w-0">
        <span className="font-semibold text-slate-700 block truncate">{row.title}</span>
        <span className="text-xs text-slate-400">{row.customerName}</span>
      </span>
      <span className="text-xs font-semibold whitespace-nowrap">
        {row.minutes}m {suffix}
      </span>
    </li>
  );
}

function UsersTab({
  selfId,
  users,
  skillTags,
}: {
  selfId: string;
  users: UserDTO[];
  skillTags: string[];
}) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "worker" | "admin">("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [users, q, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="flex-1 min-w-48 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="all">All roles</option>
          <option value="customer">Customers</option>
          <option value="worker">Specialists</option>
          <option value="admin">Admins</option>
        </select>
        <button
          type="button"
          onClick={() => setShowCreate((s) => !s)}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl px-3 py-2"
        >
          <Plus className="w-4 h-4" /> New user
        </button>
      </div>

      {showCreate && (
        <CreateUserForm skillTags={skillTags} onDone={() => setShowCreate(false)} />
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-100">
        {filtered.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === selfId} />
        ))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-400">No users.</div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, isSelf }: { user: UserDTO; isSelf: boolean }) {
  const wp = user.workerProfile;
  const suspended = user.status === "suspended";
  return (
    <div className="p-4 flex items-center gap-3 flex-wrap">
      <Avatar src={user.avatarUrl} name={user.name} className="w-10 h-10" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 truncate">{user.name}</span>
          <RoleTag user={user} />
          {suspended && (
            <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
              Suspended
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">{user.email}</p>
        {wp && (
          <p className="text-[11px] text-slate-400 mt-0.5">
            {wp.tags.join(", ") || "no skills"} · {wp.rating}★ ·{" "}
            {wp.completedJobsCount} jobs
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-end">
        {wp && wp.vetStatus === "pending" && (
          <>
            <ActionButton
              action={() => vetTechnician(user.id, "vetted")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Vet
            </ActionButton>
            <ActionButton
              action={() => vetTechnician(user.id, "rejected")}
              className="bg-white border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg px-2.5 py-1.5"
            >
              <ShieldX className="w-3.5 h-3.5" /> Reject
            </ActionButton>
          </>
        )}
        {wp && wp.vetStatus === "vetted" && wp.level === "technician" && (
          <ActionButton
            action={() => setWorkerLevel(user.id, "manager")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg px-2.5 py-1.5"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" /> Promote
          </ActionButton>
        )}
        {wp && wp.level === "manager" && (
          <ActionButton
            action={() => setWorkerLevel(user.id, "technician")}
            className="bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 text-xs font-semibold rounded-lg px-2.5 py-1.5"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" /> Demote
          </ActionButton>
        )}
        {!isSelf &&
          (suspended ? (
            <ActionButton
              action={() => setUserStatus(user.id, "active")}
              className="bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 text-xs font-semibold rounded-lg px-2.5 py-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reactivate
            </ActionButton>
          ) : (
            <ActionButton
              action={() => setUserStatus(user.id, "suspended")}
              confirm={`Suspend ${user.name}? They won't be able to log in.`}
              className="bg-white border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 text-xs font-semibold rounded-lg px-2.5 py-1.5"
            >
              <Ban className="w-3.5 h-3.5" /> Suspend
            </ActionButton>
          ))}
      </div>
    </div>
  );
}

function RoleTag({ user }: { user: UserDTO }) {
  if (user.role === "admin")
    return <Tag className="text-violet-700 bg-violet-50 border-violet-200">Admin</Tag>;
  if (user.role === "customer")
    return <Tag className="text-slate-600 bg-slate-100 border-slate-200">Customer</Tag>;
  const lvl = user.workerProfile?.level;
  return lvl === "manager" ? (
    <Tag className="text-indigo-700 bg-indigo-50 border-indigo-200">Manager</Tag>
  ) : (
    <Tag className="text-cyan-700 bg-cyan-50 border-cyan-200">Specialist</Tag>
  );
}

function CreateUserForm({
  skillTags,
  onDone,
}: {
  skillTags: string[];
  onDone: () => void;
}) {
  const [role, setRole] = useState<"customer" | "worker">("customer");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", bio: "" });
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    setError(null);
    setPending(true);
    const r = await adminCreateUser({ ...form, role, tags, bio: form.bio });
    setPending(false);
    if (!r.ok) setError(r.error || "Failed");
    else onDone();
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex gap-2">
        {(["customer", "worker"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`text-xs font-semibold rounded-lg px-3 py-1.5 border ${
              role === r
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-500"
            }`}
          >
            {r === "customer" ? "Customer" : "Specialist"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="Name" value={form.name} onChange={set("name")} className={inputCls} />
        <input placeholder="Email" value={form.email} onChange={set("email")} className={inputCls} />
        <input placeholder="Phone" value={form.phone} onChange={set("phone")} className={inputCls} />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={set("password")}
          className={inputCls}
        />
      </div>
      {role === "worker" && (
        <div className="flex flex-wrap gap-1.5">
          {skillTags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() =>
                setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))
              }
              className={`text-[11px] rounded-lg px-2 py-1 border ${
                tags.includes(t)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          Create
        </button>
        <button type="button" onClick={onDone} className="text-xs text-slate-500 px-3 py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}

function DisputesTab({ disputes }: { disputes: DisputeDTO[] }) {
  const [filter, setFilter] = useState<"all" | DisputeStatus>("all");
  const filtered = disputes.filter((d) => filter === "all" || d.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "open", "resolved", "dismissed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`text-xs font-semibold rounded-lg px-3 py-1.5 border capitalize ${
              filter === f
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-500 hover:text-slate-700"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Empty label="No disputes in this view." />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DisputeCard key={d.id} dispute={d} />
          ))}
        </div>
      )}
    </div>
  );
}

function DisputeCard({ dispute: d }: { dispute: DisputeDTO }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <DisputeStatusBadge status={d.status} />
            <span className="text-[11px] text-slate-400 font-mono">
              {timeAgo(d.createdAt)}
            </span>
          </div>
          <h3 className="font-semibold text-slate-800 mt-1.5">{d.taskTitle}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Raised by{" "}
            <span className="font-semibold text-slate-700">{d.raisedByName}</span>{" "}
            <Tag
              className={
                d.raisedByRole === "customer"
                  ? "text-slate-600 bg-slate-100 border-slate-200"
                  : "text-cyan-700 bg-cyan-50 border-cyan-200"
              }
            >
              {d.raisedByRole === "customer" ? "Customer" : "Specialist"}
            </Tag>
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
        {d.reason}
      </p>

      {d.status === "open" ? (
        <ResolveForm disputeId={d.id} />
      ) : (
        <div className="text-xs text-slate-500 border-t border-slate-100 pt-2">
          <span className="font-semibold capitalize text-slate-700">{d.status}</span>
          {d.resolvedByName ? ` by ${d.resolvedByName}` : ""}
          {d.resolvedAt ? ` · ${shortDateTime(d.resolvedAt)}` : ""}
          {d.resolution && <p className="mt-1 text-slate-600">“{d.resolution}”</p>}
        </div>
      )}
    </div>
  );
}

function ResolveForm({ disputeId }: { disputeId: string }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const act = (decision: "resolved" | "dismissed") => {
    setError(null);
    start(async () => {
      const r = await resolveDispute(disputeId, decision, note);
      if (!r.ok) setError(r.error || "Failed");
    });
  };

  return (
    <div className="space-y-2 border-t border-slate-100 pt-3">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Resolution note (what was decided / actioned)…"
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {error && <p className="text-[11px] text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => act("resolved")}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg px-3 py-2"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Resolve
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => act("dismissed")}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 disabled:opacity-60 text-xs font-semibold rounded-lg px-3 py-2"
        >
          <XCircle className="w-4 h-4" /> Dismiss
        </button>
      </div>
    </div>
  );
}

function DisputeStatusBadge({ status }: { status: DisputeStatus }) {
  const map: Record<DisputeStatus, string> = {
    open: "text-red-700 bg-red-50 border-red-200",
    resolved: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dismissed: "text-slate-600 bg-slate-100 border-slate-200",
  };
  return <Tag className={map[status]}>{status}</Tag>;
}

function AuditTab({ audit }: { audit: AuditEntry[] }) {
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");

  const actions = useMemo(
    () => Array.from(new Set(audit.map((a) => a.action))).sort(),
    [audit]
  );

  const filtered = useMemo(
    () =>
      audit.filter((e) => {
        if (action !== "all" && e.action !== action) return false;
        if (
          q &&
          !`${e.actorName} ${e.detail ?? ""} ${e.action}`
            .toLowerCase()
            .includes(q.toLowerCase())
        )
          return false;
        return true;
      }),
    [audit, q, action]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search actor, action, or detail…"
            className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="all">All actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <Card title="Audit log" icon={<ScrollText className="w-4 h-4 text-indigo-500" />}>
        {filtered.length === 0 ? (
          <Empty label="No matching audit entries." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((e) => (
              <li key={e.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-slate-700">
                      {e.actorName}
                    </span>
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                      {e.action}
                    </span>
                  </div>
                  {e.detail && (
                    <p className="text-xs text-slate-500 mt-0.5">{e.detail}</p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap text-right">
                  {timeAgo(e.createdAt)}
                  <span className="block">{shortDateTime(e.createdAt)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SettingsTab({
  settings,
  skillTags,
}: {
  settings: AdminSettings;
  skillTags: string[];
}) {
  const [form, setForm] = useState<AdminSettings>(settings);
  const [tags, setTags] = useState<string[]>(skillTags);
  const [newTag, setNewTag] = useState("");
  const [settingsState, setSettingsState] = useState<{ pending: boolean; msg: string | null }>({
    pending: false,
    msg: null,
  });
  const [tagsState, setTagsState] = useState<{ pending: boolean; msg: string | null }>({
    pending: false,
    msg: null,
  });

  const setField = (k: keyof AdminSettings) => (v: number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const saveSettings = async () => {
    setSettingsState({ pending: true, msg: null });
    const r = await updateSettings({
      commissionPct: Number(form.commissionPct),
      minJobPrice: Number(form.minJobPrice),
      unclaimedAlarmMinutes: Number(form.unclaimedAlarmMinutes),
      managerNoResponseMinutes: Number(form.managerNoResponseMinutes),
      maxImagesPerTicket: Number(form.maxImagesPerTicket),
      maxImageSizeMb: Number(form.maxImageSizeMb),
    });
    setSettingsState({ pending: false, msg: r.ok ? "Saved." : r.error || "Failed" });
  };

  const saveTags = async () => {
    setTagsState({ pending: true, msg: null });
    const r = await updateSkillTags(tags);
    setTagsState({ pending: false, msg: r.ok ? "Saved." : r.error || "Failed" });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card
          title="Pricing & commission"
          icon={<DollarSign className="w-4 h-4 text-indigo-500" />}
        >
          <div className="divide-y divide-slate-100">
            <SettingRow
              label="Platform commission"
              description={`Cut taken from each completed job. Specialists keep ${(
                100 - form.commissionPct
              ).toFixed(0)}%.`}
              value={form.commissionPct}
              onChange={setField("commissionPct")}
              unit="%"
            />
            <SettingRow
              label="Minimum job price"
              description="Lowest price a manager can set."
              value={form.minJobPrice}
              onChange={setField("minJobPrice")}
              unit="$"
              step="0.01"
            />
          </div>
        </Card>

        <Card title="Timers & limits" icon={<AlarmClock className="w-4 h-4 text-indigo-500" />}>
          <div className="divide-y divide-slate-100">
            <SettingRow
              label="Manager no-response timer"
              description="Auto-escalate if a submitted ticket is untouched."
              value={form.managerNoResponseMinutes}
              onChange={setField("managerNoResponseMinutes")}
              unit="min"
            />
            <SettingRow
              label="Worker rebroadcast timer"
              description="Re-broadcast if an approved job goes unclaimed."
              value={form.unclaimedAlarmMinutes}
              onChange={setField("unclaimedAlarmMinutes")}
              unit="min"
            />
            <SettingRow
              label="Max images per ticket"
              description="Upload cap on a single request."
              value={form.maxImagesPerTicket}
              onChange={setField("maxImagesPerTicket")}
              unit="imgs"
            />
            <SettingRow
              label="Max image size"
              description="Per-file upload limit."
              value={form.maxImageSizeMb}
              onChange={setField("maxImageSizeMb")}
              unit="MB"
            />
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveSettings}
            disabled={settingsState.pending}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-4 py-2"
          >
            {settingsState.pending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save settings
          </button>
          {settingsState.msg && (
            <span className="text-xs text-slate-500">{settingsState.msg}</span>
          )}
        </div>
      </div>

      <Card title="Skill categories" icon={<UsersIcon className="w-4 h-4 text-indigo-500" />}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 rounded-lg px-2 py-1"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTags((p) => p.filter((x) => x !== t))}
                  className="text-slate-400 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a category"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => {
                const t = newTag.trim();
                if (t && !tags.includes(t)) setTags((p) => [...p, t]);
                setNewTag("");
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg px-3 py-2"
            >
              Add
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveTags}
              disabled={tagsState.pending}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-4 py-2"
            >
              {tagsState.pending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save categories
            </button>
            {tagsState.msg && <span className="text-xs text-slate-500">{tagsState.msg}</span>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function SettingRow({
  label,
  description,
  value,
  onChange,
  unit,
  step,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  step?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <div className="flex items-stretch rounded-xl border border-slate-300 bg-white overflow-hidden shrink-0 focus-within:ring-2 focus-within:ring-indigo-500">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 text-right px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none"
        />
        <span className="flex items-center px-2.5 text-xs text-slate-400 bg-slate-50 border-l border-slate-200">
          {unit}
        </span>
      </div>
    </div>
  );
}

const inputCls =
  "w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

function Kpi({
  icon,
  label,
  value,
  tone = "text-slate-800",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
        {icon} {label}
      </div>
      <div className={`text-2xl font-bold mt-1.5 ${tone}`}>{value}</div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-4">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider border rounded px-1.5 py-0.5 ${className}`}
    >
      {children}
    </span>
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

function Empty({ label }: { label: string }) {
  return <div className="text-center text-xs text-slate-400 py-6">{label}</div>;
}
