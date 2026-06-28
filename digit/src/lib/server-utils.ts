import "server-only";
import { revalidatePath } from "next/cache";
import { getCurrentUser, type CurrentUser } from "./auth";

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) throw new Error("Not authenticated");
  return u;
}

export async function requireCustomer(): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== "customer") throw new Error("Forbidden: customers only");
  return u;
}

export async function requireWorker(): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== "worker") throw new Error("Forbidden: specialists only");
  return u;
}

export async function requireVettedWorker(): Promise<CurrentUser> {
  const u = await requireWorker();
  if (u.workerProfile?.vetStatus !== "vetted") {
    throw new Error("Forbidden: your specialist account is not vetted yet");
  }
  return u;
}

export async function requireManager(): Promise<CurrentUser> {
  const u = await requireWorker();
  if (u.workerProfile?.level !== "manager") {
    throw new Error("Forbidden: managers only");
  }
  return u;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const u = await requireUser();
  if (u.role !== "admin") throw new Error("Forbidden: admins only");
  return u;
}

// Refresh every role's area after a mutation so all open dashboards update.
export function revalidateAll(): void {
  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath("/admin");
}
