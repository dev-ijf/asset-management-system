"use server";

import { revalidatePath } from "next/cache";
import { ApprovalStatus, ApprovalTransactionType, Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { createAssetHistory } from "@/lib/asset-history";
import {
  DISPOSED_STATUS_CODE,
  DisposalRuleError as ApprovalRuleError,
  findActiveDisposal,
  findStatusIdByCode,
  lockAsset,
  reverseDisposal,
} from "@/lib/asset-disposal";
import { approvalTypeLabel } from "@/lib/approval-types";
import { prisma } from "@/lib/prisma";
import { isFutureDate } from "@/lib/datetime";
import { REQUEST_STATUSES, type MaintenanceStatus } from "@/lib/maintenance-rules";
import { REJECT_NOTE_MIN } from "@/lib/approval-types";
import { TEXT_LIMITS } from "@/lib/text-limits";

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
  if (await findActiveDisposal(tx, request.assetId)) {
    throw new ApprovalRuleError("Asset sudah didisposal sehingga movement tidak bisa diterapkan. Tolak request ini.");
  }

  const payload = payloadObject(request.payload);
  const toLocationId = optionalString(payload.toLocationId);
  const toDepartmentId = optionalString(payload.toDepartmentId);
  const toAssetUserId = optionalString(payload.toAssetUserId);
  const performedAt = payloadDate(payload.performedAt);
  if (isFutureDate(performedAt)) {
    throw new ApprovalRuleError("Tanggal movement melebihi hari ini sehingga tidak bisa diterapkan. Tolak request ini.");
  }

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
  const disposedStatusId = await findStatusIdByCode(tx, DISPOSED_STATUS_CODE);

  if (!disposedStatusId) {
    throw new ApprovalRuleError("Status DISPOSED belum tersedia di master Asset Status.");
  }

  if (await findActiveDisposal(tx, request.assetId)) {
    throw new ApprovalRuleError("Asset sudah didisposal. Request disposal ini tidak bisa disetujui lagi; tolak request ini.");
  }

  const disposedAt = payloadDate(payload.disposedAt);
  if (isFutureDate(disposedAt)) {
    throw new ApprovalRuleError("Tanggal disposal melebihi hari ini sehingga tidak bisa diterapkan. Tolak request ini.");
  }

  // Snapshot the asset as it is now (row is locked), not as it was when the request was made,
  // so reverse restores the state that disposal actually replaced.
  const disposal = await tx.assetDisposal.create({
    data: {
      assetId: request.assetId,
      previousStatusId: request.asset.assetStatusId === disposedStatusId ? null : request.asset.assetStatusId,
      previousLocationId: request.asset.assetLocationId,
      previousDepartmentId: request.asset.departmentId,
      disposedStatusId,
      disposedAt,
      reason: optionalString(payload.reason) ?? "Disposal approved",
      performedById: request.requesterId,
    },
  });

  await tx.asset.update({
    where: { id: request.assetId },
    data: { assetStatusId: disposedStatusId },
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

async function applyDisposalReversal(
  tx: Prisma.TransactionClient,
  request: { id: string; assetId: string; requesterId: string | null; payload: Prisma.JsonValue },
  approverId: string,
) {
  const payload = payloadObject(request.payload);
  const disposalId = optionalString(payload.disposalId);
  const reason = optionalString(payload.reason);

  if (!disposalId || !reason) throw new ApprovalRuleError("Data pembatalan disposal tidak lengkap. Tolak request ini.");

  const result = await reverseDisposal(tx, { disposalId, assetId: request.assetId, reason, reversedById: approverId });

  await createAssetHistory({
    action: "DISPOSAL_REVERSED",
    assetId: request.assetId,
    changedById: approverId,
    description: `Pembatalan disposal asset ${result.code} disetujui. Alasan: ${reason}`,
    payload: {
      approvalRequestId: request.id,
      disposalId,
      reason,
      requesterId: request.requesterId,
      fromStatusId: result.fromStatusId,
      toStatusId: result.toStatusId,
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
    createdAt: Date;
    asset: { code: string };
  },
  approverId: string,
) {
  // The asset may have been disposed while this request waited.
  if (await findActiveDisposal(tx, request.assetId)) {
    throw new ApprovalRuleError("Asset sudah didisposal sehingga maintenance tidak bisa diterapkan. Tolak request ini.");
  }

  const payload = payloadObject(request.payload);
  const status = optionalString(payload.status) ?? "OPEN";
  // Requests made before this rule could already say COMPLETED; they must be resubmitted.
  if (!REQUEST_STATUSES.includes(status as MaintenanceStatus)) {
    throw new ApprovalRuleError(
      `Request maintenance berstatus ${status}, padahal request hanya boleh OPEN atau IN_PROGRESS. Tolak request ini dan minta diajukan ulang.`,
    );
  }
  const completedDate = null;

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
      // When the work was requested, not when it was approved: the earliest valid completed date.
      createdAt: request.createdAt,
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

  const target = await prisma.assetApprovalRequest.findUnique({ where: { id }, select: { assetId: true } });

  if (!target) return { message: "Approval request tidak ditemukan." };

  try {
    await prisma.$transaction(async (tx) => {
      // One approval at a time per asset: disposal/movement checks below see a stable asset.
      await lockAsset(tx, target.assetId);

      // Claim the request; a double click or a second approver gets count 0 and stops here.
      const claimed = await tx.assetApprovalRequest.updateMany({
        where: { id, status: ApprovalStatus.PENDING },
        data: { status: ApprovalStatus.APPROVED, reviewedById: user.id, reviewedAt: new Date() },
      });

      if (claimed.count !== 1) throw new ApprovalRuleError("Approval request sudah diproses.");

      const request = await tx.assetApprovalRequest.findUniqueOrThrow({
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

      if (request.asset.deletedAt) throw new ApprovalRuleError("Asset yang sudah dihapus tidak bisa diproses approval.");

      if (request.transactionType === ApprovalTransactionType.MOVEMENT) {
        await applyMovement(tx, request, user.id);
      }

      if (request.transactionType === ApprovalTransactionType.DISPOSAL) {
        await applyDisposal(tx, request, user.id);
      }

      if (request.transactionType === ApprovalTransactionType.DISPOSAL_REVERSAL) {
        await applyDisposalReversal(tx, request, user.id);
      }

      if (request.transactionType === ApprovalTransactionType.MAINTENANCE) {
        await applyMaintenance(tx, request, user.id);
      }
    });

    revalidateApprovalPaths(target.assetId);
    return { ok: true, message: "Approval request berhasil disetujui." };
  } catch (error) {
    return {
      message: error instanceof ApprovalRuleError ? error.message : "Approval request gagal disetujui. Silakan coba lagi.",
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
  // The requester only sees this note, so a rejection must say why.
  if (rejectNote.length < REJECT_NOTE_MIN) {
    return { message: `Alasan reject wajib diisi (minimal ${REJECT_NOTE_MIN} karakter) agar requester tahu apa yang perlu diperbaiki.` };
  }
  if (rejectNote.length > TEXT_LIMITS.description) {
    return { message: `Alasan reject maksimal ${TEXT_LIMITS.description} karakter.` };
  }

  const request = await prisma.assetApprovalRequest.findUnique({
    where: { id },
    include: { asset: { select: { code: true } } },
  });

  if (!request) return { message: "Approval request tidak ditemukan." };
  if (request.status !== ApprovalStatus.PENDING) return { message: "Approval request sudah diproses." };

  try {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.assetApprovalRequest.updateMany({
        where: { id: request.id, status: ApprovalStatus.PENDING },
        data: {
          status: ApprovalStatus.REJECTED,
          rejectNote: rejectNote || null,
          reviewedById: user.id,
          reviewedAt: new Date(),
        },
      });

      if (claimed.count !== 1) throw new ApprovalRuleError("Approval request sudah diproses.");

      await createAssetHistory({
        action: "REJECTED",
        assetId: request.assetId,
        changedById: user.id,
        description: `Approval ${approvalTypeLabel(request.transactionType).toLowerCase()} asset ${request.asset.code} ditolak.`,
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
  } catch (error) {
    return { message: error instanceof ApprovalRuleError ? error.message : "Approval request gagal ditolak." };
  }
}
