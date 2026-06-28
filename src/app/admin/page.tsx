import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllTasksDTO,
  getAuditLogDTO,
  getDisputesDTO,
  getUsersDTO,
} from "@/lib/queries";
import {
  getSettings,
  getSkillTags,
  isSubmittedStale,
  isTaskAlarmed,
  minutesSinceBroadcast,
  minutesSinceCreated,
  platformCut,
} from "@/lib/settings";
import LiveRefresh from "@/components/LiveRefresh";
import AdminDashboard, {
  type AdminAnalytics,
  type AdminSettings,
} from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [users, tasks, settings, skillTags, disputes, audit] = await Promise.all([
    getUsersDTO(),
    getAllTasksDTO(),
    getSettings(),
    getSkillTags(),
    getDisputesDTO(),
    getAuditLogDTO(200),
  ]);

  const paid = tasks.filter((t) => t.status === "paid");
  const grossRevenue = paid.reduce((s, t) => s + t.price, 0);
  const commissionEarned = paid.reduce(
    (s, t) => s + platformCut(t.price, settings.commissionPct),
    0
  );
  const rated = paid.filter((t) => typeof t.rating === "number" && t.rating! > 0);
  const avgRating = rated.length
    ? rated.reduce((s, t) => s + (t.rating || 0), 0) / rated.length
    : 0;

  const workers = users.filter((u) => u.role === "worker");
  const alarmTasks = tasks.filter((t) =>
    isTaskAlarmed(t, settings.unclaimedAlarmMinutes)
  );
  const staleTasks = tasks.filter((t) =>
    isSubmittedStale(t, settings.managerNoResponseMinutes)
  );
  const openDisputes = disputes.filter((d) => d.status === "open").length;

  const analytics: AdminAnalytics = {
    grossRevenue,
    commissionEarned,
    paidJobs: paid.length,
    totalTasks: tasks.length,
    avgRating,
    ratedCount: rated.length,
    workersVetted: workers.filter((w) => w.workerProfile?.vetStatus === "vetted")
      .length,
    workersPending: workers.filter(
      (w) => w.workerProfile?.vetStatus === "pending"
    ).length,
    managers: workers.filter((w) => w.workerProfile?.level === "manager").length,
    customers: users.filter((u) => u.role === "customer").length,
    alarmsCount: alarmTasks.length,
    staleSubmitted: staleTasks.length,
    openDisputes,
  };

  const alarms = alarmTasks.map((t) => ({
    id: t.id,
    title: t.title,
    customerName: t.customerName,
    minutes: minutesSinceBroadcast(t),
  }));

  const staleTickets = staleTasks.map((t) => ({
    id: t.id,
    title: t.title,
    customerName: t.customerName,
    minutes: minutesSinceCreated(t),
  }));

  const adminSettings: AdminSettings = {
    commissionPct: settings.commissionPct,
    minJobPrice: settings.minJobPrice,
    unclaimedAlarmMinutes: settings.unclaimedAlarmMinutes,
    managerNoResponseMinutes: settings.managerNoResponseMinutes,
    maxImagesPerTicket: settings.maxImagesPerTicket,
    maxImageSizeMb: settings.maxImageSizeMb,
  };

  return (
    <>
      <LiveRefresh intervalMs={4000} />
      <AdminDashboard
        selfId={user.id}
        users={users}
        analytics={analytics}
        alarms={alarms}
        staleTickets={staleTickets}
        settings={adminSettings}
        skillTags={skillTags}
        disputes={disputes}
        audit={audit}
      />
    </>
  );
}
