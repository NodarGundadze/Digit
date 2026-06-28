import "server-only";
import { prisma } from "./db";
import { getSession } from "./session";

// Returns the current authenticated user (with workerProfile) from the DB, or
// null. Suspended users are treated as logged out so they can't access areas.
export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  const user = await prisma.user.findUnique({
    where: { id: s.userId },
    include: { workerProfile: true },
  });
  if (!user || user.status === "suspended") return null;
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
