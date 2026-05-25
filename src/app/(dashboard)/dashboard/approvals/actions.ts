"use server";

import { revalidatePath } from "next/cache";
import { ApprovalStatus, ApprovalTransactionType, Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { createAssetHistory } from "@/lib/asset-history";
import { prisma } from "@/lib/prisma";

export type ApprovalActionState = {
  ok?: boolean;
  message?: string;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function payloadObject(payload: Prisma.JsonValue) {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, Prisma.JsonValue>;
  }

  return {};
}

function payloadDate(value: unknown) {
  if (typeof value !== "string" || !value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function revalidateApprovalPaths(assetId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard/transactions/movements");
  revalidatePath("/dashboard/transactions/disposals");
  revalidatePath("/dashboard/maintenance");
  revalidatePath("/dashboard/assets");

  if (assetId) {
    revalidatePath(`/dashboard/assets/${assetId}`);
    revalidatePath(`/dashboard/assets/${assetId}/history`);
  }
}

async function applyMovement(
  tx: Prisma.TransactionClient,
  request: {
    id: string;
    assetId: string;
    requesterId: string | null;
    payload: Prisma.JsonValue;
    asset: {
      code: string;
      name: string;
      assetLocationId: string | null;
      departmentId: string | null;
      assetUserId: string | null;
    };
  },
  approverId: string,
) {
  const payload = payloadObject(request.payload);
  const toLocationId = optionalString(payload.toLocationId);
  const toDepartmentId = optionalString(payload.toDepartmentId);
  const toAssetUserId = optionalString(payload.toAssetUserId);
  const performedAt = payloadDate(payload.performedAt);

  const movement = await tx.assetMovement.create({
    data: {
      assetId: request.assetId,
      fromLocationId: optionalString(payload.fromLocationId) ?? request.asset.assetLocationId,
      toLocationId,
      fromDepartmentId: optionalString(payload.fromDepartmentId) ?? request.asset.departmentId,
      toDepartmentId,
      fromAssetUserId: optionalString(payload.fromAssetUserId) ?? request.asset.assetUserId,
      toAssetUserId,
      performedAt,
      notes: optionalString(payload.notes),
      performedById: request.requesterId,
    },
  });

  await tx.asset.update({
    where: { id: request.assetId },
    data: {
      assetLocationId: toLocationId ?? request.asset.assetLocationId,
      departmentId: toDepartmentId ?? request.asset.departmentId,
      assetUserId: toAssetUserId ?? request.asset.assetUserId,
    },
  });

  await createAssetHistory({
    action: "MOVED",
    assetId: request.assetId,
    changedById: approverId,
    description: `Approval movement asset ${request.asset.code} disetujui.`,
    payload: {
      approvalRequestId: request.id,
      movementId: movement.id,
      fromLocationId: movement.fromLocationId,
      toLocationId: movement.toLocationId,
      fromDepartmentId: movement.fromDepartmentId,
      toDepartmentId: movement.toDepartmentId,
      fromAssetUserId: movement.fromAssetUserId,
      toAssetUserId: movement.toAssetUserId,
    },
    tx,
  });
}

async function applyDisposal(
  tx: Prisma.TransactionClient,
  request: {
    id: string;
    assetId: string;
    requesterId: string | null;
    payload: Prisma.JsonValue;
    asset: {
      code: string;
      assetStatusId: string | null;
      assetLocationId: string | null;
      departmentId: string | null;
    };
  },
  approverId: string,
) {
  const payload = payloadObject(request.payload);
  const disposedStatus = await tx.assetStatus.findUnique({ where: { code: "DISPOSED" }, select: { id: true } });

  if (!disposedStatus) {
    throw new Error("Status DISPOSED belum tersedia di master Asset Status.");
  }

  const disposal = await tx.assetDisposal.create({
    data: {
      assetId: request.assetId,
      previousStatusId: optionalString(payload.previousStatusId) ?? request.asset.assetStatusId,
      previousLocationId: optionalString(payload.previousLocationId) ?? request.asset.assetLocationId,
      previousDepartmentId: optionalString(payload.previousDepartmentId) ?? request.asset.departmentId,
      disposedStatusId: disposedStatus.id,
      disposedAt: payloadDate(payload.disposedAt),
      reason: optionalString(payload.reason) ?? "Disposal approved",
      performedById: request.requesterId,
    },
  });

  await tx.asset.update({
    where: { id: request.assetId },
    data: { assetStatusId: disposedStatus.id },
  });

  await createAssetHistory({
    action: "DISPOSED",
    assetId: request.assetId,
    changedById: approverId,
    description: `Approval disposal asset ${request.asset.code} disetujui.`,
    payload: {
      approvalRequestId: request.id,
      disposalId: disposal.id,
      reason: disposal.reason,
      disposedAt: disposal.disposedAt.toISOString(),
    },
    tx,
  });
}

async function applyMaintenance(
  tx: Prisma.TransactionClient,
  request: {
    id: string;
    assetId: string;
    requesterId: string | null;
    payload: Prisma.JsonValue;
    asset: { code: string };
  },
  approverId: string,
) {
  const payload = payloadObject(request.payload);
  const status = optionalString(payload.status) ?? "COMPLETED";
  const completedDate = optionalString(payload.completedDate)
    ? payloadDate(payload.completedDate)
    : status === "COMPLETED"
      ? new Date()
      : null;

  const maintenance = await tx.assetMaintenance.create({
    data: {
      assetId: request.assetId,
      description: optionalString(payload.description) ?? "Maintenance approved",
      status,
      scheduledDate: optionalString(payload.scheduledDate) ? payloadDate(payload.scheduledDate) : null,
      completedDate,
      cost: optionalString(payload.cost),
      vendor: optionalString(payload.vendor),
      notes: optionalString(payload.notes),
      createdById: request.requesterId,
    },
  });

  await createAssetHistory({
    action: maintenance.status === "COMPLETED" ? "MAINTENANCE_COMPLETED" : "MAINTENANCE_CREATED",
    assetId: request.assetId,
    changedById: approverId,
    description: `Approval maintenance asset ${request.asset.code} disetujui.`,
    payload: {
      approvalRequestId: request.id,
      maintenanceId: maintenance.id,
      status: maintenance.status,
    },
    tx,
  });
}

export async function approveApprovalRequestAction(
  _state: ApprovalActionState,
  formData: FormData,
): Promise<ApprovalActionState> {
  const user = await requirePermission("approvals.manage");
  const id = getString(formData, "id");

  if (!id) return { message: "Approval request tidak valid." };

  const request = await prisma.assetApprovalRequest.findUnique({
    where: { id },
    include: {
      asset: {
        select: {
          code: true,
          name: true,
          deletedAt: true,
          assetStatusId: true,
          assetLocationId: true,
          departmentId: true,
          assetUserId: true,
        },
      },
    },
  });

  if (!request) return { message: "Approval request tidak ditemukan." };
  if (request.status !== ApprovalStatus.PENDING) return { message: "Approval request sudah diproses." };
  if (request.asset.deletedAt) return { message: "Asset yang sudah dihapus tidak bisa diproses approval." };

  try {
    await prisma.$transaction(async (tx) => {
      if (request.transactionType === ApprovalTransactionType.MOVEMENT) {
        await applyMovement(tx, request, user.id);
      }

      if (request.transactionType === ApprovalTransactionType.DISPOSAL) {
        await applyDisposal(tx, request, user.id);
      }

      if (request.transactionType === ApprovalTransactionType.MAINTENANCE) {
        await applyMaintenance(tx, request, user.id);
      }

      await tx.assetApprovalRequest.update({
        where: { id: request.id },
        data: {
          status: ApprovalStatus.APPROVED,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });
    });

    revalidateApprovalPaths(request.assetId);
    return { ok: true, message: "Approval request berhasil disetujui." };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Approval request gagal disetujui.",
    };
  }
}

export async function rejectApprovalRequestAction(
  _state: ApprovalActionState,
  formData: FormData,
): Promise<ApprovalActionState> {
  const user = await requirePermission("approvals.manage");
  const id = getString(formData, "id");
  const rejectNote = getString(formData, "rejectNote");

  if (!id) return { message: "Approval request tidak valid." };

  const request = await prisma.assetApprovalRequest.findUnique({
    where: { id },
    include: { asset: { select: { code: true } } },
  });

  if (!request) return { message: "Approval request tidak ditemukan." };
  if (request.status !== ApprovalStatus.PENDING) return { message: "Approval request sudah diproses." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.assetApprovalRequest.update({
        where: { id: request.id },
        data: {
          status: ApprovalStatus.REJECTED,
          rejectNote: rejectNote || null,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });

      await createAssetHistory({
        action: "REJECTED",
        assetId: request.assetId,
        changedById: user.id,
        description: `Approval ${request.transactionType.toLowerCase()} asset ${request.asset.code} ditolak.`,
        payload: {
          approvalRequestId: request.id,
          transactionType: request.transactionType,
          rejectNote: rejectNote || null,
        },
        tx,
      });
    });

    revalidateApprovalPaths(request.assetId);
    return { ok: true, message: "Approval request berhasil ditolak." };
  } catch {
    return { message: "Approval request gagal ditolak." };
  }
}
