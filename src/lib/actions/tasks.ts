"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import {
  requireCustomer,
  requireManager,
  requireVettedWorker,
  requireWorker,
  revalidateAll,
} from "@/lib/server-utils";
import type { ActionResult } from "@/lib/types";

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Action failed" };
}

// Recompute a technician's running average rating + job count when a job closes.
async function creditTechnician(
  technicianId: string | null,
  rating: number | null | undefined
) {
  if (!technicianId) return;
  const wp = await prisma.workerProfile.findUnique({
    where: { userId: technicianId },
  });
  if (!wp) return;
  const r = rating ?? 5;
  const newCount = wp.completedJobsCount + 1;
  const newRating = parseFloat(
    ((wp.rating * wp.completedJobsCount + r) / newCount).toFixed(1)
  );
  await prisma.workerProfile.update({
    where: { userId: technicianId },
    data: { completedJobsCount: newCount, rating: newRating },
  });
}

// ---------------- Customer ----------------

export async function createTask(input: {
  title: string;
  description: string;
  photoUrl: string;
  tags: string[];
  location: { lat: number; lng: number; address: string };
  price: number;
}): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const title = input.title.trim();
    const description = input.description.trim();
    if (!title || !description) {
      return { ok: false, error: "Title and description are required." };
    }
    const price = Number(input.price);
    if (!Number.isFinite(price) || price <= 0) {
      return { ok: false, error: "Enter a valid budget." };
    }

    await prisma.task.create({
      data: {
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        title,
        description,
        photoUrl: input.photoUrl || "",
        tags: JSON.stringify(input.tags || []),
        status: "submitted",
        price,
        originalPrice: price,
        locLat: input.location.lat,
        locLng: input.location.lng,
        locAddress: input.location.address,
        logs: {
          create: {
            status: "submitted",
            note: `Problem submitted by ${user.name}. Initial budget: $${price}.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function approveInitialPrice(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.customerId !== user.id)
      return { ok: false, error: "Task not found." };
    if (task.initialPriceStatus !== "pending_approval")
      return { ok: false, error: "No price proposal awaiting approval." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        // Stay "submitted" and hand back to the manager — approval no longer
        // auto-broadcasts; the manager broadcasts the now-approved price.
        initialPriceStatus: "approved",
        logs: {
          create: {
            status: "submitted",
            note: `Customer approved the proposed price of $${task.price}. Returned to manager to broadcast.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function rejectInitialPrice(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.customerId !== user.id)
      return { ok: false, error: "Task not found." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        initialPriceStatus: "rejected",
        logs: {
          create: {
            status: "submitted",
            note: "Customer declined the proposed price. Request needs revision.",
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function approveScopeChange(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { scopeRequest: true },
    });
    if (!task || task.customerId !== user.id)
      return { ok: false, error: "Task not found." };
    if (!task.scopeRequest || task.scopeRequest.status !== "pending_client")
      return { ok: false, error: "No scope change awaiting your approval." };

    const newPrice = task.scopeRequest.requestedNewPrice;
    await prisma.task.update({
      where: { id: taskId },
      data: {
        price: newPrice,
        scopeRequest: { update: { status: "approved" } },
        logs: {
          create: {
            status: task.status,
            note: `Customer approved the price readjustment to $${newPrice}. Reason: ${task.scopeRequest.reason}`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function rejectScopeChange(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { scopeRequest: true },
    });
    if (!task || task.customerId !== user.id)
      return { ok: false, error: "Task not found." };
    if (!task.scopeRequest || task.scopeRequest.status !== "pending_client")
      return { ok: false, error: "No scope change awaiting your approval." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        scopeRequest: { update: { status: "rejected" } },
        logs: {
          create: {
            status: task.status,
            note: `Customer declined the price readjustment. Original price of $${task.price} remains.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function approveFinishedJob(
  taskId: string,
  rating: number,
  feedback: string
): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.customerId !== user.id)
      return { ok: false, error: "Task not found." };
    if (task.status !== "completed_pending")
      return { ok: false, error: "This job is not awaiting your approval." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "completed_customer_approved",
        rating,
        feedback,
        logs: {
          create: {
            status: "completed_customer_approved",
            note: `Customer approved the fix and rated the service ${rating} stars. Feedback: "${
              feedback || "No comment"
            }"`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function payInvoice(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireCustomer();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.customerId !== user.id)
      return { ok: false, error: "Task not found." };
    if (task.status !== "invoiced")
      return { ok: false, error: "No invoice awaiting payment." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "paid",
        logs: {
          create: {
            status: "paid",
            note: `Customer settled the final invoice of $${task.price}. Ticket closed.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    await creditTechnician(task.assignedTechnicianId, task.rating);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------- Manager ----------------

export async function proposeInitialPrice(
  taskId: string,
  price: number,
  tags: string[],
  reason: string
): Promise<ActionResult> {
  try {
    const user = await requireManager();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { ok: false, error: "Task not found." };
    if (task.status !== "submitted")
      return { ok: false, error: "Only submitted tasks can be priced." };
    if (!Number.isFinite(price) || price <= 0)
      return { ok: false, error: "Enter a valid price." };
    const { minJobPrice } = await getSettings();
    if (price < minJobPrice)
      return { ok: false, error: `Price can't be below the $${minJobPrice} minimum job price.` };
    if (!tags.length)
      return { ok: false, error: "Select at least one skill tag." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        price,
        tags: JSON.stringify(tags),
        initialPriceStatus: "pending_approval",
        initialPriceReason: reason,
        logs: {
          create: {
            status: "submitted",
            note: `Manager ${user.name} proposed a price of $${price}. Reason: "${reason}". Awaiting customer approval.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function broadcastTask(
  taskId: string,
  tags: string[],
  price?: number
): Promise<ActionResult> {
  try {
    const user = await requireManager();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { ok: false, error: "Task not found." };
    if (task.status !== "submitted")
      return { ok: false, error: "Task cannot be broadcast in its current state." };

    // When broadcasting straight from pricing at the customer's own budget, the
    // manager passes the on-screen price so it is what actually ships.
    const setPrice = Number.isFinite(price) && (price as number) > 0;
    const { minJobPrice } = await getSettings();
    const effectivePrice = setPrice ? (price as number) : task.price;
    if (effectivePrice < minJobPrice)
      return { ok: false, error: `Broadcast price can't be below the $${minJobPrice} minimum job price.` };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "broadcasted",
        tags: JSON.stringify(tags.length ? tags : JSON.parse(task.tags || "[]")),
        ...(setPrice ? { price } : {}),
        initialPriceStatus: "approved",
        broadcastedAt: new Date(),
        logs: {
          create: {
            status: "broadcasted",
            note: `Manager ${user.name} broadcast the request to specialists matching: ${tags.join(
              ", "
            )}`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function reviewScopeChange(
  taskId: string,
  action: "forward" | "reject"
): Promise<ActionResult> {
  try {
    const user = await requireManager();
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { scopeRequest: true },
    });
    if (!task) return { ok: false, error: "Task not found." };
    if (!task.scopeRequest || task.scopeRequest.status !== "pending_manager")
      return { ok: false, error: "No scope change awaiting manager review." };

    const nextStatus = action === "forward" ? "pending_client" : "rejected";
    const note =
      action === "forward"
        ? `Manager ${user.name} approved the scope change and forwarded it to the customer for final sign-off.`
        : `Manager ${user.name} declined the scope change request. Original price of $${task.price} remains.`;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        scopeRequest: { update: { status: nextStatus } },
        logs: {
          create: {
            status: task.status,
            note,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function issueInvoice(
  taskId: string,
  finalPrice: number
): Promise<ActionResult> {
  try {
    const user = await requireManager();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { ok: false, error: "Task not found." };
    if (
      task.status !== "completed_customer_approved" &&
      task.status !== "completed_pending"
    )
      return { ok: false, error: "Job is not ready for invoicing." };
    if (!Number.isFinite(finalPrice) || finalPrice <= 0)
      return { ok: false, error: "Enter a valid invoice amount." };
    const { minJobPrice } = await getSettings();
    if (finalPrice < minJobPrice)
      return { ok: false, error: `Invoice can't be below the $${minJobPrice} minimum job price.` };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "invoiced",
        price: finalPrice,
        logs: {
          create: {
            status: "invoiced",
            note: `Manager ${user.name} issued the final invoice of $${finalPrice} to the customer.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function finalizeAndCloseJob(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireManager();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { ok: false, error: "Task not found." };
    if (task.status !== "completed_customer_approved")
      return { ok: false, error: "Job is not awaiting closure." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "paid",
        logs: {
          create: {
            status: "paid",
            note: `Manager ${user.name} finalized and closed the ticket.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    await creditTechnician(task.assignedTechnicianId, task.rating);
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------- Worker (technician) ----------------

export async function acceptTask(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireVettedWorker();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { ok: false, error: "Task not found." };
    if (task.status !== "broadcasted" || task.assignedTechnicianId)
      return { ok: false, error: "This job has already been claimed." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "accepted",
        assignedTechnicianId: user.id,
        assignedTechnicianName: user.name,
        assignedTechnicianPhone: user.phone,
        logs: {
          create: {
            status: "accepted",
            note: `Specialist ${user.name} claimed the job.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markEnRoute(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireWorker();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.assignedTechnicianId !== user.id)
      return { ok: false, error: "Task not assigned to you." };
    if (task.status !== "accepted")
      return { ok: false, error: "You can only head out on a claimed job." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "en_route",
        logs: {
          create: {
            status: "en_route",
            note: `Specialist ${user.name} is en route to the site.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markArrived(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireWorker();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.assignedTechnicianId !== user.id)
      return { ok: false, error: "Task not assigned to you." };
    if (task.status !== "en_route")
      return { ok: false, error: "You can only arrive while en route." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "arrived",
        logs: {
          create: {
            status: "arrived",
            note: `Specialist ${user.name} arrived on site.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function startJob(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireWorker();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.assignedTechnicianId !== user.id)
      return { ok: false, error: "Task not assigned to you." };
    if (task.status !== "arrived")
      return { ok: false, error: "You can only start work after arriving on site." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "in_progress",
        logs: {
          create: {
            status: "in_progress",
            note: `Specialist ${user.name} started work on site.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function finishJob(taskId: string): Promise<ActionResult> {
  try {
    const user = await requireWorker();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.assignedTechnicianId !== user.id)
      return { ok: false, error: "Task not assigned to you." };
    if (task.status !== "in_progress")
      return { ok: false, error: "Job is not in progress." };

    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "completed_pending",
        logs: {
          create: {
            status: "completed_pending",
            note: `Specialist ${user.name} marked the job complete. Awaiting customer approval.`,
            updatedById: user.id,
            updatedByName: user.name,
          },
        },
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function requestScopeChange(
  taskId: string,
  newPrice: number,
  newTime: string,
  reason: string
): Promise<ActionResult> {
  try {
    const user = await requireWorker();
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.assignedTechnicianId !== user.id)
      return { ok: false, error: "Task not assigned to you." };
    if (!["accepted", "en_route", "arrived", "in_progress"].includes(task.status))
      return { ok: false, error: "Price readjustments are only allowed on active jobs." };
    if (!Number.isFinite(newPrice) || newPrice <= 0)
      return { ok: false, error: "Enter a valid proposed price." };
    if (!reason.trim())
      return { ok: false, error: "Provide a reason for the change." };

    await prisma.scopeRequest.upsert({
      where: { taskId },
      update: {
        requestedNewPrice: newPrice,
        requestedNewTime: newTime,
        reason,
        status: "pending_manager",
        createdAt: new Date(),
      },
      create: {
        taskId,
        requestedNewPrice: newPrice,
        requestedNewTime: newTime,
        reason,
        status: "pending_manager",
      },
    });
    await prisma.taskLog.create({
      data: {
        taskId,
        status: task.status,
        note: `Specialist ${user.name} requested a price readjustment: new fee $${newPrice}, extra time ${newTime}. Reason: ${reason}. Awaiting manager review.`,
        updatedById: user.id,
        updatedByName: user.name,
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------- Disputes (customer or assigned specialist) ----------------

export async function raiseDispute(
  taskId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Not authenticated." };
    const note = reason.trim();
    if (!note) return { ok: false, error: "Describe the issue you're disputing." };

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) return { ok: false, error: "Task not found." };

    const isCustomer = task.customerId === user.id;
    const isAssignedTech = task.assignedTechnicianId === user.id;
    if (!isCustomer && !isAssignedTech)
      return { ok: false, error: "You can only dispute your own jobs." };

    const existingOpen = await prisma.dispute.findFirst({
      where: { taskId, status: "open" },
    });
    if (existingOpen)
      return { ok: false, error: "This job already has an open dispute under review." };

    await prisma.dispute.create({
      data: {
        taskId,
        raisedById: user.id,
        raisedByName: user.name,
        raisedByRole: isCustomer ? "customer" : "worker",
        reason: note,
      },
    });
    await prisma.taskLog.create({
      data: {
        taskId,
        status: task.status,
        note: `${isCustomer ? "Customer" : "Specialist"} ${user.name} raised a dispute: ${note}`,
        updatedById: user.id,
        updatedByName: user.name,
      },
    });
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

