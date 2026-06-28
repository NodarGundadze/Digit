import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCustomerTasksDTO } from "@/lib/queries";
import { getSettings, getSkillTags } from "@/lib/settings";
import { LOCATION_PRESETS } from "@/lib/types";
import LiveRefresh from "@/components/LiveRefresh";
import CustomerDashboard from "@/components/customer/CustomerDashboard";

export default async function CustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [tasks, skillTags, settings] = await Promise.all([
    getCustomerTasksDTO(user.id),
    getSkillTags(),
    getSettings(),
  ]);

  return (
    <>
      <LiveRefresh />
      <CustomerDashboard
        tasks={tasks}
        skillTags={skillTags}
        locationPresets={LOCATION_PRESETS}
        maxImageSizeMb={settings.maxImageSizeMb}
      />
    </>
  );
}
