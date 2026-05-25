"use server";

import { revalidatePath } from "next/cache";
import { ApprovalTransactionType, AuditStatus } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { createAssetHistory } from "@/lib/asset-history";
import { prisma } from "@/lib/prisma";

export type TransactionActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const MOVEMENTS_PATH = "/dashboard/transactions/movements";
const DISPOSALS_PATH = "/dashboard/transactions/disposals";
const AUDITS_PATH = "/dashboard/transactions/audits";
const MAINTENANCE_PATH = "/dashboard/maintenance";
const APPROVALS_PATH = "/dashboard/approvals";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(value: string) {
  return value || null;
}

function parseDate(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseOptionalNumber(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function todayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function revalidateAsset(assetId: string) {
  revalidatePath("/dashboard/assets");
  revalidatePath(`/dashboard/assets/${assetId}`);
  revalidatePath(`/dashboard/assets/${assetId}/history`);
}

function revalidateApprovalQueues() {
  revalidatePath(APPROVALS_PATH);
  revalidatePath("/dashboard");
}

export async function createMovementAction(
  _state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requirePermission("movements.manage");
  const assetId = getString(formData, "assetId");
  const toLocationId = getString(formData, "toLocationId");
  const toDepartmentId = getString(formData, "toDepartmentId");
  const toAssetUserId = getString(formData, "toAssetUserId");
  const performedAtInput = getString(formData, "performedAt");
  const notes = getString(formData, "notes");
  const performedAt = performedAtInput ? parseDate(performedAtInput) : todayDate();
  const errors: TransactionActionState["errors"] = {};

  if (!assetId) errors.assetId = "Asset wajib dipilih.";
  if (!toLocationId && !toDepartmentId && !toAssetUserId) errors.destination = "Minimal isi salah satu tujuan baru.";
  if (!performedAt) errors.performedAt = "Tanggal movement tidak valid.";

  const asset = assetId
    ? await prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          code: true,
          name: true,
          assetLocationId: true,
          departmentId: true,
          assetUserId: true,
          deletedAt: true,
        },
      })
    : null;

  if (!asset) errors.assetId = "Asset tidak ditemukan.";
  if (asset?.deletedAt) errors.assetId = "Asset yang sudah dihapus tidak bisa dimove.";

  const activeDisposal = assetId
    ? await prisma.assetDisposal.findFirst({
        where: { assetId, reversedAt: null },
        select: { id: true },
      })
    : null;

  if (activeDisposal) errors.assetId = "Asset yang sudah disposal tidak bisa dimove.";

  if (
    asset &&
    (!toLocationId || toLocationId === asset.assetLocationId) &&
    (!toDepartmentId || toDepartmentId === asset.departmentId) &&
    (!toAssetUserId || toAssetUserId === asset.assetUserId)
  ) {
    errors.destination = "Tujuan movement tidak boleh sama dengan kondisi saat ini.";
  }

  if (Object.keys(errors).length > 0 || !asset || !performedAt) {
    return { errors, message: "Movement gagal dibuat. Periksa kembali input." };
  }

  try {
    await prisma.assetApprovalRequest.create({
      data: {
        transactionType: ApprovalTransactionType.MOVEMENT,
        assetId,
        requesterId: user.id,
        payload: {
          fromLocationId: asset.assetLocationId,
          toLocationId: optional(toLocationId),
          fromDepartmentId: asset.departmentId,
          toDepartmentId: optional(toDepartmentId),
          fromAssetUserId: asset.assetUserId,
          toAssetUserId: optional(toAssetUserId),
          performedAt: performedAt.toISOString(),
          notes: optional(notes),
        },
      },
    });

    revalidatePath(MOVEMENTS_PATH);
    revalidateApprovalQueues();
    revalidateAsset(assetId);

    return { ok: true, message: "Request movement berhasil dibuat dan menunggu approval." };
  } catch {
    return { message: "Request movement gagal dibuat. Silakan coba lagi." };
  }
}

export async function createDisposalAction(
  _state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requirePermission("disposals.manage");
  const assetId = getString(formData, "assetId");
  const reason = getString(formData, "reason");
  const disposedAtInput = getString(formData, "disposedAt");
  const disposedAt = disposedAtInput ? parseDate(disposedAtInput) : todayDate();
  const errors: TransactionActionState["errors"] = {};

  if (!assetId) errors.assetId = "Asset wajib dipilih.";
  if (!reason) errors.reason = "Reason wajib diisi.";
  if (!disposedAt) errors.disposedAt = "Tanggal disposal tidak valid.";

  const asset = assetId
    ? await prisma.asset.findUnique({
        where: { id: assetId },
        select: {
          id: true,
          code: true,
          assetStatusId: true,
          assetLocationId: true,
          departmentId: true,
          deletedAt: true,
        },
      })
    : null;

  const disposedStatus = await prisma.assetStatus.findUnique({
    where: { code: "DISPOSED" },
    select: { id: true },
  });

  const activeDisposal = assetId
    ? await prisma.assetDisposal.findFirst({
        where: { assetId, reversedAt: null },
        select: { id: true },
      })
    : null;

  if (!asset) errors.assetId = "Asset tidak ditemukan.";
  if (asset?.deletedAt) errors.assetId = "Asset yang sudah dihapus tidak bisa disposal.";
  if (!disposedStatus) errors.status = "Status DISPOSED belum tersedia di master Asset Status.";
  if (activeDisposal) errors.assetId = "Asset sudah memiliki disposal aktif.";

  if (Object.keys(errors).length > 0 || !asset || !disposedStatus || !disposedAt) {
    return { errors, message: "Disposal gagal dibuat. Periksa kembali input." };
  }

  try {
    await prisma.assetApprovalRequest.create({
      data: {
        transactionType: ApprovalTransactionType.DISPOSAL,
        assetId,
        requesterId: user.id,
        payload: {
          previousStatusId: asset.assetStatusId,
          previousLocationId: asset.assetLocationId,
          previousDepartmentId: asset.departmentId,
          disposedStatusId: disposedStatus.id,
          disposedAt: disposedAt.toISOString(),
          reason,
        },
      },
    });

    revalidatePath(DISPOSALS_PATH);
    revalidateApprovalQueues();
    revalidateAsset(assetId);

    return { ok: true, message: "Request disposal berhasil dibuat dan menunggu approval." };
  } catch {
    return { message: "Request disposal gagal dibuat. Silakan coba lagi." };
  }
}

export async function reverseDisposalAction(
  _state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requirePermission("disposals.manage");
  const disposalId = getString(formData, "disposalId");

  if (!disposalId) {
    return { errors: { disposalId: "Disposal tidak valid." }, message: "Disposal tidak valid." };
  }

  const disposal = await prisma.assetDisposal.findUnique({
    where: { id: disposalId },
    include: { asset: { select: { code: true, deletedAt: true } } },
  });

  if (!disposal) return { message: "Disposal tidak ditemukan." };
  if (disposal.reversedAt) return { message: "Disposal sudah direverse." };
  if (disposal.asset.deletedAt) return { message: "Asset yang sudah dihapus tidak bisa direverse." };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.assetDisposal.update({
        where: { id: disposal.id },
        data: { reversedAt: new Date(), reversedById: user.id },
      });

      await tx.asset.update({
        where: { id: disposal.assetId },
        data: {
          assetStatusId: disposal.previousStatusId,
          assetLocationId: disposal.previousLocationId,
          departmentId: disposal.previousDepartmentId,
        },
      });

      await createAssetHistory({
        action: "DISPOSAL_REVERSED",
        assetId: disposal.assetId,
        changedById: user.id,
        description: `Disposal asset ${disposal.asset.code} direverse.`,
        payload: { disposalId: disposal.id },
        tx,
      });
    });

    revalidatePath(DISPOSALS_PATH);
    revalidateAsset(disposal.assetId);

    return { ok: true, message: "Disposal berhasil direverse." };
  } catch {
    return { message: "Reverse disposal gagal. Silakan coba lagi." };
  }
}

export async function createAuditAction(
  _state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requirePermission("audits.manage");
  const assetId = getString(formData, "assetId");
  const status = getString(formData, "status");
  const locationId = getString(formData, "locationId");
  const auditedAtInput = getString(formData, "auditedAt");
  const notes = getString(formData, "notes");
  const auditedAt = auditedAtInput ? parseDate(auditedAtInput) : todayDate();
  const statuses = Object.values(AuditStatus);
  const errors: TransactionActionState["errors"] = {};

  if (!assetId) errors.assetId = "Asset wajib dipilih.";
  if (!statuses.includes(status as AuditStatus)) errors.status = "Status audit tidak valid.";
  if (!auditedAt) errors.auditedAt = "Tanggal audit tidak valid.";

  const asset = assetId
    ? await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true, code: true, deletedAt: true } })
    : null;

  if (!asset) errors.assetId = "Asset tidak ditemukan.";
  if (asset?.deletedAt) errors.assetId = "Asset yang sudah dihapus tidak bisa diaudit.";

  if (Object.keys(errors).length > 0 || !asset || !auditedAt) {
    return { errors, message: "Audit gagal dibuat. Periksa kembali input." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const audit = await tx.assetAudit.create({
        data: {
          assetId,
          status: status as AuditStatus,
          locationId: optional(locationId),
          auditedAt,
          notes: optional(notes),
          auditedById: user.id,
        },
      });

      await createAssetHistory({
        action: "AUDITED",
        assetId,
        changedById: user.id,
        description: `Audit asset ${asset.code}: ${status}.`,
        payload: { auditId: audit.id, status, locationId: audit.locationId },
        tx,
      });
    });

    revalidatePath(AUDITS_PATH);
    revalidateAsset(assetId);

    return { ok: true, message: "Audit asset berhasil dibuat." };
  } catch {
    return { message: "Audit asset gagal dibuat. Silakan coba lagi." };
  }
}

export async function createMaintenanceAction(
  _state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requirePermission("maintenance.manage");
  const assetId = getString(formData, "assetId");
  const description = getString(formData, "description");
  const status = getString(formData, "status") || "OPEN";
  const scheduledDate = parseDate(getString(formData, "scheduledDate"));
  const completedDate = parseDate(getString(formData, "completedDate"));
  const costInput = getString(formData, "cost");
  const cost = parseOptionalNumber(costInput);
  const vendor = getString(formData, "vendor");
  const notes = getString(formData, "notes");
  const errors: TransactionActionState["errors"] = {};

  if (!assetId) errors.assetId = "Asset wajib dipilih.";
  if (!description) errors.description = "Description wajib diisi.";
  if (costInput && (cost === null || cost < 0)) errors.cost = "Cost harus angka 0 atau lebih.";

  const asset = assetId
    ? await prisma.asset.findUnique({ where: { id: assetId }, select: { id: true, code: true, deletedAt: true } })
    : null;

  if (!asset) errors.assetId = "Asset tidak ditemukan.";
  if (asset?.deletedAt) errors.assetId = "Asset yang sudah dihapus tidak bisa dibuat maintenance.";

  if (Object.keys(errors).length > 0 || !asset) {
    return { errors, message: "Maintenance gagal dibuat. Periksa kembali input." };
  }

  try {
    await prisma.assetApprovalRequest.create({
      data: {
        transactionType: ApprovalTransactionType.MAINTENANCE,
        assetId,
        requesterId: user.id,
        payload: {
          assetId,
          description,
          status,
          scheduledDate: scheduledDate?.toISOString() ?? null,
          completedDate: completedDate?.toISOString() ?? null,
          cost: costInput ? costInput : null,
          vendor: optional(vendor),
          notes: optional(notes),
        },
      },
    });

    revalidatePath(MAINTENANCE_PATH);
    revalidateApprovalQueues();
    revalidateAsset(assetId);

    return { ok: true, message: "Request maintenance berhasil dibuat dan menunggu approval." };
  } catch {
    return { message: "Request maintenance gagal dibuat. Silakan coba lagi." };
  }
}

export async function updateMaintenanceAction(
  _state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requirePermission("maintenance.manage");
  const id = getString(formData, "id");
  const description = getString(formData, "description");
  const status = getString(formData, "status") || "OPEN";
  const scheduledDate = parseDate(getString(formData, "scheduledDate"));
  const completedDate = parseDate(getString(formData, "completedDate"));
  const costInput = getString(formData, "cost");
  const cost = parseOptionalNumber(costInput);
  const vendor = getString(formData, "vendor");
  const notes = getString(formData, "notes");
  const errors: TransactionActionState["errors"] = {};

  if (!id) errors.id = "Maintenance tidak valid.";
  if (!description) errors.description = "Description wajib diisi.";
  if (costInput && (cost === null || cost < 0)) errors.cost = "Cost harus angka 0 atau lebih.";

  const existing = id
    ? await prisma.assetMaintenance.findUnique({
        where: { id },
        include: { asset: { select: { code: true, deletedAt: true } } },
      })
    : null;

  if (!existing) errors.id = "Maintenance tidak ditemukan.";
  if (existing?.asset.deletedAt) errors.id = "Asset yang sudah dihapus tidak bisa diupdate maintenance.";

  if (Object.keys(errors).length > 0 || !existing) {
    return { errors, message: "Maintenance gagal diperbarui. Periksa kembali input." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const maintenance = await tx.assetMaintenance.update({
        where: { id },
        data: {
          description,
          status,
          scheduledDate,
          completedDate: status === "COMPLETED" ? completedDate ?? todayDate() : completedDate,
          cost: costInput ? costInput : null,
          vendor: optional(vendor),
          notes: optional(notes),
        },
      });

      const completedNow = existing.status !== "COMPLETED" && maintenance.status === "COMPLETED";

      await createAssetHistory({
        action: completedNow ? "MAINTENANCE_COMPLETED" : "MAINTENANCE_UPDATED",
        assetId: maintenance.assetId,
        changedById: user.id,
        description: `Maintenance asset ${existing.asset.code} diperbarui.`,
        payload: { maintenanceId: maintenance.id, status: maintenance.status },
        tx,
      });
    });

    revalidatePath(MAINTENANCE_PATH);
    revalidateAsset(existing.assetId);

    return { ok: true, message: "Maintenance berhasil diperbarui." };
  } catch {
    return { message: "Maintenance gagal diperbarui. Silakan coba lagi." };
  }
}

export async function completeMaintenanceAction(
  _state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  formData.set("status", "COMPLETED");
  return updateMaintenanceAction(_state, formData);
}

export async function deleteMaintenanceAction(
  _state: TransactionActionState,
  formData: FormData,
): Promise<TransactionActionState> {
  const user = await requirePermission("maintenance.manage");
  const id = getString(formData, "id");

  const maintenance = id
    ? await prisma.assetMaintenance.findUnique({
        where: { id },
        include: { asset: { select: { code: true } } },
      })
    : null;

  if (!maintenance) {
    return { message: "Maintenance tidak ditemukan." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await createAssetHistory({
        action: "MAINTENANCE_UPDATED",
        assetId: maintenance.assetId,
        changedById: user.id,
        description: `Maintenance asset ${maintenance.asset.code} dihapus.`,
        payload: { maintenanceId: maintenance.id, deleted: true },
        tx,
      });

      await tx.assetMaintenance.delete({ where: { id: maintenance.id } });
    });

    revalidatePath(MAINTENANCE_PATH);
    revalidateAsset(maintenance.assetId);

    return { ok: true, message: "Maintenance berhasil dihapus." };
  } catch {
    return { message: "Maintenance gagal dihapus. Silakan coba lagi." };
  }
}
