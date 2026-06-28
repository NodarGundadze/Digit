"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, destroySession } from "@/lib/session";
import { roleHome, type Role, type WorkerLevel } from "@/lib/types";

export interface AuthState {
  error?: string;
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { workerProfile: true },
  });
  if (!user) return { error: "No account found with that email." };
  if (user.status === "suspended") {
    return { error: "This account has been suspended. Contact an administrator." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Incorrect password." };

  await createSession({
    userId: user.id,
    role: user.role as Role,
    name: user.name,
    level: user.workerProfile?.level as WorkerLevel | undefined,
  });

  redirect(roleHome(user.role as Role));
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "customer") as Role;
  const tags = formData.getAll("tags").map((t) => String(t));
  const bio = String(formData.get("bio") || "").trim();

  if (!name || !email || !password) {
    return { error: "Name, email, and password are required." };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  // Managers are not self-registerable; they are promoted by an admin.
  if (role !== "customer" && role !== "worker") {
    return { error: "Invalid account type." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await hashPassword(password);

  if (role === "worker") {
    if (tags.length === 0) {
      return { error: "Select at least one skill category." };
    }
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "worker",
        phone: phone || null,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
          email
        )}`,
        workerProfile: {
          create: {
            tags: JSON.stringify(tags),
            bio,
            vetStatus: "pending",
            level: "technician",
            curLat: 47.6062 + (Math.random() - 0.5) * 0.05,
            curLng: -122.3321 + (Math.random() - 0.5) * 0.05,
            curAddress: "Seattle, WA",
            curUpdatedAt: new Date(),
          },
        },
      },
      include: { workerProfile: true },
    });
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "customer",
        phone: phone || null,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
          email
        )}`,
      },
    });
  }

  const created = await prisma.user.findUnique({
    where: { email },
    include: { workerProfile: true },
  });
  if (!created) return { error: "Failed to create account." };

  await createSession({
    userId: created.id,
    role: created.role as Role,
    name: created.name,
    level: created.workerProfile?.level as WorkerLevel | undefined,
  });

  redirect(roleHome(created.role as Role));
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
