import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllTasksDTO,
  getBroadcastQueueDTO,
  getTechnicianTasksDTO,
} from "@/lib/queries";
import { getSettings, getSkillTags } from "@/lib/settings";
import { toWorkerProfileDTO } from "@/lib/types";
import LiveRefresh from "@/components/LiveRefresh";
import { PendingState } from "@/components/work/PendingState";
import WorkerDashboard from "@/components/work/WorkerDashboard";

export default async function WorkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.workerProfile) redirect("/login");

  const profile = toWorkerProfileDTO(user.workerProfile);

  if (profile.vetStatus !== "vetted") {
    return (
      <>
        <LiveRefresh intervalMs={5000} />
        <PendingState vetStatus={profile.vetStatus} />
      </>
    );
  }

  const isManager = profile.level === "manager";
  const [queue, myTasks, settings] = await Promise.all([
    getBroadcastQueueDTO(),
    getTechnicianTasksDTO(user.id),
    getSettings(),
  ]);

  const managerData = isManager
    ? {
        tasks: await getAllTasksDTO(),
        skillTags: await getSkillTags(),
        alarmMinutes: settings.unclaimedAlarmMinutes,
      }
    : undefined;

  return (
    <>
      <LiveRefresh />
      <WorkerDashboard
        me={{
          id: user.id,
          name: user.name,
          vetStatus: profile.vetStatus,
          level: profile.level,
          tags: profile.tags,
          location: profile.currentLocation
            ? {
                lat: profile.currentLocation.lat,
                lng: profile.currentLocation.lng,
              }
            : null,
        }}
        queue={queue}
        myTasks={myTasks}
        commissionPct={settings.commissionPct}
        managerData={managerData}
      />
    </>
  );
}
