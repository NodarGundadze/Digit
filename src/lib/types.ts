// Domain types (string unions, mirroring the original app) + DTOs passed from
// server components to client components, plus mappers from Prisma rows.

import type {
  User,
  WorkerProfile,
  Task,
  TaskLog,
  ScopeRequest,
  Dispute,
} from "@/generated/prisma/client";

export type Role = "customer" | "worker" | "admin";
export type UserStatus = "active" | "suspended";
export type VetStatus = "pending" | "vetted" | "rejected";
export type WorkerLevel = "technician" | "manager";
export type DisputeStatus = "open" | "resolved" | "dismissed";

export type TaskStatus =
  | "submitted"
  | "broadcasted"
  | "accepted"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed_pending"
  | "completed_customer_approved"
  | "invoiced"
  | "paid";

export type InitialPriceStatus = "pending_approval" | "approved" | "rejected";
export type ScopeStatus =
  | "pending_manager"
  | "pending_client"
  | "approved"
  | "rejected";

// Default platform skill categories (was AVAILABLE_TAGS in the old app).
export const AVAILABLE_TAGS = [
  "Frontend Dev",
  "Backend Dev",
  "Fullstack Dev",
  "Network Engineering",
  "DevOps & Cloud",
  "Cyber Security",
  "Database Administration",
  "Systems & Support",
];

// Seattle location presets reused by the customer "file outage" form.
export const LOCATION_PRESETS = [
  { lat: 47.6101, lng: -122.3421, address: "Pike Place Market, Seattle, WA 98101" },
  { lat: 47.5984, lng: -122.3301, address: "Pioneer Square, Seattle, WA 98104" },
  { lat: 47.6205, lng: -122.3493, address: "Space Needle, Seattle, WA 98109" },
  { lat: 47.6097, lng: -122.3331, address: "Downtown Seattle, WA 98104" },
];

export const DEMO_PASSWORD = "demo1234";

export function roleHome(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "worker") return "/work";
  return "/dashboard";
}

// Standard result returned by server actions invoked from client handlers.
export type ActionResult = { ok: boolean; error?: string };

// ---------- DTOs (plain serializable objects for client components) ----------

export interface LocationDTO {
  lat: number;
  lng: number;
  address: string;
}

export interface WorkerProfileDTO {
  tags: string[];
  bio: string;
  vetStatus: VetStatus;
  level: WorkerLevel;
  rating: number;
  completedJobsCount: number;
  vettedById?: string | null;
  vettedAt?: string | null;
  currentLocation?: LocationDTO | null;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  status: UserStatus;
  createdAt: string;
  workerProfile?: WorkerProfileDTO | null;
}

export interface TaskLogDTO {
  status: TaskStatus;
  note: string;
  timestamp: string;
  updatedById: string;
  updatedByName: string;
}

export interface ScopeRequestDTO {
  requestedNewPrice: number;
  requestedNewTime: string;
  reason: string;
  status: ScopeStatus;
  createdAt: string;
}

export interface DisputeDTO {
  id: string;
  taskId: string;
  taskTitle: string;
  raisedById: string;
  raisedByName: string;
  raisedByRole: Role;
  reason: string;
  status: DisputeStatus;
  resolution?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface TaskDTO {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  title: string;
  description: string;
  photoUrl: string;
  tags: string[];
  status: TaskStatus;
  price: number;
  originalPrice?: number | null;
  initialPriceStatus?: InitialPriceStatus | null;
  initialPriceReason?: string | null;
  assignedTechnicianId?: string | null;
  assignedTechnicianName?: string | null;
  assignedTechnicianPhone?: string | null;
  location: LocationDTO;
  routeHistory: { lat: number; lng: number; timestamp: number }[];
  rating?: number | null;
  feedback?: string | null;
  createdAt: string;
  broadcastedAt?: string | null;
  logs: TaskLogDTO[];
  scopeRequest?: ScopeRequestDTO | null;
  disputeStatus?: DisputeStatus | null;
}

// ---------- mappers ----------

function parseJSON<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type UserWithProfile = User & { workerProfile?: WorkerProfile | null };

export function toUserDTO(u: UserWithProfile): UserDTO {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as Role,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    status: u.status as UserStatus,
    createdAt: u.createdAt.toISOString(),
    workerProfile: u.workerProfile ? toWorkerProfileDTO(u.workerProfile) : null,
  };
}

export function toWorkerProfileDTO(w: WorkerProfile): WorkerProfileDTO {
  return {
    tags: parseJSON<string[]>(w.tags, []),
    bio: w.bio,
    vetStatus: w.vetStatus as VetStatus,
    level: w.level as WorkerLevel,
    rating: w.rating,
    completedJobsCount: w.completedJobsCount,
    vettedById: w.vettedById,
    vettedAt: w.vettedAt ? w.vettedAt.toISOString() : null,
    currentLocation:
      w.curLat != null && w.curLng != null
        ? {
            lat: w.curLat,
            lng: w.curLng,
            address: w.curAddress ?? "",
          }
        : null,
  };
}

type TaskWithRelations = Task & {
  logs?: TaskLog[];
  scopeRequest?: ScopeRequest | null;
  disputes?: Dispute[];
};

export function toTaskDTO(t: TaskWithRelations): TaskDTO {
  return {
    id: t.id,
    customerId: t.customerId,
    customerName: t.customerName,
    customerPhone: t.customerPhone,
    title: t.title,
    description: t.description,
    photoUrl: t.photoUrl,
    tags: parseJSON<string[]>(t.tags, []),
    status: t.status as TaskStatus,
    price: t.price,
    originalPrice: t.originalPrice,
    initialPriceStatus: (t.initialPriceStatus as InitialPriceStatus) ?? null,
    initialPriceReason: t.initialPriceReason,
    assignedTechnicianId: t.assignedTechnicianId,
    assignedTechnicianName: t.assignedTechnicianName,
    assignedTechnicianPhone: t.assignedTechnicianPhone,
    location: { lat: t.locLat, lng: t.locLng, address: t.locAddress },
    routeHistory: parseJSON<{ lat: number; lng: number; timestamp: number }[]>(
      t.routeHistory,
      []
    ),
    rating: t.rating,
    feedback: t.feedback,
    createdAt: t.createdAt.toISOString(),
    broadcastedAt: t.broadcastedAt ? t.broadcastedAt.toISOString() : null,
    logs: (t.logs ?? [])
      .slice()
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map((l) => ({
        status: l.status as TaskStatus,
        note: l.note,
        timestamp: l.timestamp.toISOString(),
        updatedById: l.updatedById,
        updatedByName: l.updatedByName,
      })),
    scopeRequest: t.scopeRequest
      ? {
          requestedNewPrice: t.scopeRequest.requestedNewPrice,
          requestedNewTime: t.scopeRequest.requestedNewTime,
          reason: t.scopeRequest.reason,
          status: t.scopeRequest.status as ScopeStatus,
          createdAt: t.scopeRequest.createdAt.toISOString(),
        }
      : null,
    disputeStatus: t.disputes?.length
      ? (t.disputes[0].status as DisputeStatus)
      : null,
  };
}

type DisputeWithTask = Dispute & { task?: { title: string } | null };

export function toDisputeDTO(d: DisputeWithTask): DisputeDTO {
  return {
    id: d.id,
    taskId: d.taskId,
    taskTitle: d.task?.title ?? "(deleted task)",
    raisedById: d.raisedById,
    raisedByName: d.raisedByName,
    raisedByRole: d.raisedByRole as Role,
    reason: d.reason,
    status: d.status as DisputeStatus,
    resolution: d.resolution,
    resolvedByName: d.resolvedByName,
    resolvedAt: d.resolvedAt ? d.resolvedAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  };
}
