import "server-only";
import { prisma } from "./db";
import { AVAILABLE_TAGS } from "./types";
import type { TaskDTO } from "./types";

export async function getSettings() {
  const existing = await prisma.platformSettings.findUnique({
    where: { id: "singleton" },
  });
  if (existing) return existing;
  return prisma.platformSettings.create({
    data: { id: "singleton", skillTags: JSON.stringify(AVAILABLE_TAGS) },
  });
}

export const DEFAULT_BRAND_NAME = "Dig-IT";

export interface Branding {
  primary: string | null; // null = built-in indigo palette
  logoUrl: string | null; // null = wrench icon
  brandName: string;
}

export async function getBranding(): Promise<Branding> {
  const s = await getSettings();
  return {
    primary: s.brandPrimary || null,
    logoUrl: s.logoUrl || null,
    brandName: s.brandName?.trim() || DEFAULT_BRAND_NAME,
  };
}

export async function getSkillTags(): Promise<string[]> {
  const s = await getSettings();
  try {
    const tags = JSON.parse(s.skillTags) as string[];
    return tags.length ? tags : AVAILABLE_TAGS;
  } catch {
    return AVAILABLE_TAGS;
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function workerPayout(price: number, commissionPct: number): number {
  return round2(price * (1 - commissionPct / 100));
}

export function platformCut(price: number, commissionPct: number): number {
  return round2(price * (commissionPct / 100));
}

// A broadcasted task with no assignee older than the alarm threshold is overdue.
export function isTaskAlarmed(task: TaskDTO, alarmMinutes: number): boolean {
  if (task.status !== "broadcasted" || task.assignedTechnicianId) return false;
  const since = task.broadcastedAt
    ? new Date(task.broadcastedAt).getTime()
    : new Date(task.createdAt).getTime();
  return Date.now() - since > alarmMinutes * 60_000;
}

export function minutesSinceBroadcast(task: TaskDTO): number {
  const since = task.broadcastedAt
    ? new Date(task.broadcastedAt).getTime()
    : new Date(task.createdAt).getTime();
  return Math.floor((Date.now() - since) / 60_000);
}

// A submitted ticket no manager has priced yet, older than the no-response
// timer, should auto-escalate (manager no-response alarm).
export function isSubmittedStale(task: TaskDTO, minutes: number): boolean {
  if (task.status !== "submitted" || task.initialPriceStatus) return false;
  return Date.now() - new Date(task.createdAt).getTime() > minutes * 60_000;
}

export function minutesSinceCreated(task: TaskDTO): number {
  return Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 60_000);
}
