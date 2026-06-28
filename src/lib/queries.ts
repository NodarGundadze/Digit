import "server-only";
import { prisma } from "./db";
import {
  toDisputeDTO,
  toTaskDTO,
  toUserDTO,
  type DisputeDTO,
  type TaskDTO,
  type UserDTO,
} from "./types";

const taskInclude = {
  logs: true,
  scopeRequest: true,
  disputes: { orderBy: { createdAt: "desc" }, take: 1 },
} as const;

export async function getAllTasksDTO(): Promise<TaskDTO[]> {
  const tasks = await prisma.task.findMany({
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
  return tasks.map(toTaskDTO);
}

export async function getCustomerTasksDTO(customerId: string): Promise<TaskDTO[]> {
  const tasks = await prisma.task.findMany({
    where: { customerId },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
  return tasks.map(toTaskDTO);
}

export async function getTechnicianTasksDTO(techId: string): Promise<TaskDTO[]> {
  const tasks = await prisma.task.findMany({
    where: { assignedTechnicianId: techId },
    include: taskInclude,
    orderBy: { createdAt: "desc" },
  });
  return tasks.map(toTaskDTO);
}

export async function getBroadcastQueueDTO(): Promise<TaskDTO[]> {
  const tasks = await prisma.task.findMany({
    where: { status: "broadcasted", assignedTechnicianId: null },
    include: taskInclude,
    orderBy: { broadcastedAt: "desc" },
  });
  return tasks.map(toTaskDTO);
}

export async function getUsersDTO(): Promise<UserDTO[]> {
  const users = await prisma.user.findMany({
    include: { workerProfile: true },
    orderBy: { createdAt: "asc" },
  });
  return users.map(toUserDTO);
}

export async function getWorkersDTO(): Promise<UserDTO[]> {
  const users = await prisma.user.findMany({
    where: { role: "worker" },
    include: { workerProfile: true },
    orderBy: { createdAt: "asc" },
  });
  return users.map(toUserDTO);
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: string;
  detail: string | null;
  createdAt: string;
}

export async function getDisputesDTO(): Promise<DisputeDTO[]> {
  const rows = await prisma.dispute.findMany({
    include: { task: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
  // Open disputes float to the top; otherwise keep newest-first.
  const rank = (s: string) => (s === "open" ? 0 : 1);
  return rows
    .sort((a, b) => rank(a.status) - rank(b.status))
    .map(toDisputeDTO);
}

export async function getAuditLogDTO(limit = 40): Promise<AuditEntry[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map((r) => ({
    id: r.id,
    actorName: r.actorName,
    action: r.action,
    detail: r.detail,
    createdAt: r.createdAt.toISOString(),
  }));
}
