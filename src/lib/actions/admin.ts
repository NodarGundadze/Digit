"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { requireAdmin, revalidateAll } from "@/lib/server-utils";
import type { ActionResult, Role } from "@/lib/types";

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Action failed" };
}

async function audit(
  actorId: string,
  actorName: string,
  action: string,
  targetType: string,
  targetId: string,
  detail: string
) {
  await prisma.auditLog.create({
    data: { actorId, actorName, action, targetType, targetId, detail },
  });
}

export async function vetTechnician(
  userId: string,
  decision: "vetted" | "rejected"
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    if (!target || target.role !== "worker" || !target.workerProfile)
      return { ok: false, error: "Specialist not found." };

    await prisma.workerProfile.update({
      where: { userId },
      data: {
        vetStatus: decision,
        vettedById: admin.id,
        vettedAt: new Date(),
      },
    });
    await audit(
      admin.id,
      admin.name,
      decision === "vetted" ? "vet_approved" : "vet_rejected",
      "user",
      userId,
      `${decision === "vetted" ? "Approved" : "Rejected"} specialist ${target.name}.`
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setWorkerLevel(
  userId: string,
  level: "technician" | "manager"
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const target = await prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    if (!target || target.role !== "worker" || !target.workerProfile)
      return { ok: false, error: "Specialist not found." };
    if (level === "manager" && target.workerProfile.vetStatus !== "vetted")
      return { ok: false, error: "Only vetted specialists can be promoted." };

    await prisma.workerProfile.update({ where: { userId }, data: { level } });
    await audit(
      admin.id,
      admin.name,
      level === "manager" ? "promote" : "demote",
      "user",
      userId,
      `${level === "manager" ? "Promoted" : "Demoted"} ${target.name} ${
        level === "manager" ? "to manager" : "to technician"
      }.`
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setUserStatus(
  userId: string,
  status: "active" | "suspended"
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    if (userId === admin.id)
      return { ok: false, error: "You cannot change your own status." };
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) return { ok: false, error: "User not found." };

    await prisma.user.update({ where: { id: userId }, data: { status } });
    await audit(
      admin.id,
      admin.name,
      status === "suspended" ? "suspend" : "reactivate",
      "user",
      userId,
      `${status === "suspended" ? "Suspended" : "Reactivated"} ${target.name}.`
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export interface SettingsInput {
  commissionPct: number;
  minJobPrice: number;
  unclaimedAlarmMinutes: number;
  managerNoResponseMinutes: number;
  maxImagesPerTicket: number;
  maxImageSizeMb: number;
}

export async function updateSettings(input: SettingsInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const {
      commissionPct,
      minJobPrice,
      unclaimedAlarmMinutes,
      managerNoResponseMinutes,
      maxImagesPerTicket,
      maxImageSizeMb,
    } = input;

    if (!Number.isFinite(commissionPct) || commissionPct < 0 || commissionPct > 90)
      return { ok: false, error: "Commission must be between 0 and 90%." };
    if (!Number.isFinite(minJobPrice) || minJobPrice < 0)
      return { ok: false, error: "Minimum job price can't be negative." };
    if (!Number.isFinite(unclaimedAlarmMinutes) || unclaimedAlarmMinutes < 1)
      return { ok: false, error: "Worker rebroadcast timer must be at least 1 minute." };
    if (!Number.isFinite(managerNoResponseMinutes) || managerNoResponseMinutes < 1)
      return { ok: false, error: "Manager no-response timer must be at least 1 minute." };
    if (!Number.isFinite(maxImagesPerTicket) || maxImagesPerTicket < 1 || maxImagesPerTicket > 20)
      return { ok: false, error: "Max images per ticket must be between 1 and 20." };
    if (!Number.isFinite(maxImageSizeMb) || maxImageSizeMb < 1 || maxImageSizeMb > 100)
      return { ok: false, error: "Max image size must be between 1 and 100 MB." };

    const data = {
      commissionPct,
      minJobPrice,
      unclaimedAlarmMinutes: Math.round(unclaimedAlarmMinutes),
      managerNoResponseMinutes: Math.round(managerNoResponseMinutes),
      maxImagesPerTicket: Math.round(maxImagesPerTicket),
      maxImageSizeMb: Math.round(maxImageSizeMb),
    };

    await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", skillTags: "[]", ...data },
    });
    await audit(
      admin.id,
      admin.name,
      "update_settings",
      "settings",
      "singleton",
      `Commission ${commissionPct}%, min job $${minJobPrice}, rebroadcast ${unclaimedAlarmMinutes}m, manager no-response ${managerNoResponseMinutes}m, max ${maxImagesPerTicket} imgs / ${maxImageSizeMb}MB.`
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export interface BrandingInput {
  brandPrimary: string; // "" clears -> default palette
  logoUrl: string; // "" clears -> wrench icon
  brandName: string; // "" clears -> "Dig-IT"
}

// ~500KB ceiling: data-URL logos live in the settings row, so keep them small.
const MAX_LOGO_LENGTH = 700_000;

export async function updateBranding(input: BrandingInput): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();

    const primary = input.brandPrimary.trim();
    if (primary && !/^#[0-9a-f]{6}$/i.test(primary))
      return { ok: false, error: "Color must be a 6-digit hex like #4f46e5." };

    const name = input.brandName.trim();
    if (name.length > 40)
      return { ok: false, error: "Brand name must be 40 characters or fewer." };

    const logo = input.logoUrl.trim();
    if (logo) {
      const isValid =
        /^https?:\/\//i.test(logo) || /^data:image\//i.test(logo);
      if (!isValid)
        return { ok: false, error: "Logo must be an http(s) URL or an uploaded image." };
      if (logo.length > MAX_LOGO_LENGTH)
        return { ok: false, error: "Logo image is too large. Use one under ~500KB." };
    }

    const data = {
      brandPrimary: primary || null,
      logoUrl: logo || null,
      brandName: name || null,
    };

    await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", skillTags: "[]", ...data },
    });
    await audit(
      admin.id,
      admin.name,
      "update_branding",
      "settings",
      "singleton",
      `Branding updated — color ${primary || "default"}, logo ${
        logo ? "set" : "default"
      }, name ${name || "default"}.`
    );
    // Branding is global (root layout + every shell), so refresh the whole tree.
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function resolveDispute(
  disputeId: string,
  decision: "resolved" | "dismissed",
  resolution: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) return { ok: false, error: "Dispute not found." };
    if (dispute.status !== "open")
      return { ok: false, error: "This dispute has already been closed." };
    const note = resolution.trim();
    if (!note) return { ok: false, error: "Add a short resolution note." };

    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: decision,
        resolution: note,
        resolvedById: admin.id,
        resolvedByName: admin.name,
        resolvedAt: new Date(),
      },
    });
    await audit(
      admin.id,
      admin.name,
      decision === "resolved" ? "dispute_resolved" : "dispute_dismissed",
      "dispute",
      disputeId,
      `${decision === "resolved" ? "Resolved" : "Dismissed"} dispute from ${
        dispute.raisedByName
      }: ${note}`
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateSkillTags(tags: string[]): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const cleaned = Array.from(
      new Set(tags.map((t) => t.trim()).filter(Boolean))
    );
    if (cleaned.length === 0)
      return { ok: false, error: "Keep at least one skill category." };

    await prisma.platformSettings.upsert({
      where: { id: "singleton" },
      update: { skillTags: JSON.stringify(cleaned) },
      create: { id: "singleton", skillTags: JSON.stringify(cleaned) },
    });
    await audit(
      admin.id,
      admin.name,
      "update_skill_tags",
      "settings",
      "singleton",
      `Skill categories updated (${cleaned.length}).`
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function adminCreateUser(input: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Exclude<Role, "admin"> | "admin";
  tags?: string[];
  bio?: string;
}): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    if (!name || !email || !input.password)
      return { ok: false, error: "Name, email, and password are required." };
    if (input.password.length < 6)
      return { ok: false, error: "Password must be at least 6 characters." };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { ok: false, error: "Email already in use." };

    const passwordHash = await hashPassword(input.password);

    if (input.role === "worker") {
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: "worker",
          phone: input.phone || null,
          avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
            email
          )}`,
          workerProfile: {
            create: {
              tags: JSON.stringify(input.tags || []),
              bio: input.bio || "",
              vetStatus: "pending",
              level: "technician",
              curLat: 47.6062,
              curLng: -122.3321,
              curAddress: "Seattle, WA",
              curUpdatedAt: new Date(),
            },
          },
        },
      });
    } else {
      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: input.role,
          phone: input.phone || null,
          avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
            email
          )}`,
        },
      });
    }
    await audit(
      admin.id,
      admin.name,
      "create_user",
      "user",
      email,
      `Created ${input.role} account ${name} (${email}).`
    );
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
