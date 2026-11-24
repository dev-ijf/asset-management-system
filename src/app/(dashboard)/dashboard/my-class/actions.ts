"use server";

import { revalidatePath } from "next/cache";
import { ApprovalStatus, ApprovalTransactionType } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { findActiveDisposal } from "@/lib/asset-disposal";
import { classAssetWhere, CLASS_PERMISSIONS, getClassScope } from "@/lib/class-scope";
import { prisma } from "@/lib/prisma";
import { checkLengths, TEXT_LIMITS } from "@/lib/text-limits";
import { PhotoError } from "@/lib/asset-image";
import type { PreparedPhoto } from "@/lib/asset-photo-storage";
import {
  attachMaintenancePhotos,
  discardMaintenancePhotos,
  maintenancePhotoFiles,
  prepareMaintenancePhotos,
} from "@/lib/maintenance-photos";

export type ClassActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/**
 * A homeroom teacher reports a problem with an asset of their class. It becomes a normal
 * maintenance request in Approvals; the asset team fills in schedule, vendor and cost later.
 */
export async function requestClassMaintenanceAction(
  _state: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const user = await requirePermission(CLASS_PERMISSIONS.requestMaintenance);
  const assetId = getString(formData, "assetId");
  const description = getString(formData, "description");
  const notes = getString(formData, "notes");
  const errors: Record<string, string | undefined> = {};

  if (!description) errors.description = "Jelaskan kerusakan atau kebutuhan maintenance.";
  checkLengths(errors, [
    ["description", "Keterangan", description, TEXT_LIMITS.description],
    ["notes", "Catatan", notes, TEXT_LIMITS.description],
  ]);

  const scope = await getClassScope(user.id);
  if (!scope) return { message: "Akun Anda belum dihubungkan ke lokasi kelas. Hubungi admin." };

  // Only assets of the teacher's own class.
  const asset = assetId
    ? await prisma.asset.findFirst({ where: { id: assetId, ...classAssetWhere(scope) }, select: { id: true, code: true } })
    : null;
  if (!asset) return { message: "Asset tidak ditemukan di kelas Anda." };

  if (await findActiveDisposal(prisma, asset.id)) {
    return { message: "Asset ini sudah didisposal sehingga tidak bisa diajukan maintenance." };
  }
  const pending = await prisma.assetApprovalRequest.count({
    where: { assetId: asset.id, transactionType: ApprovalTransactionType.MAINTENANCE, status: ApprovalStatus.PENDING, requesterId: user.id },
  });
  if (pending > 0) return { message: "Anda sudah mengajukan maintenance untuk asset ini dan masih menunggu approval." };

  let files: File[] = [];
  try {
    files = maintenancePhotoFiles(formData);
  } catch (error) {
    errors.photos = error instanceof PhotoError ? error.message : "File foto tidak valid.";
  }

  if (Object.values(errors).some(Boolean)) {
    return { errors, message: "Periksa kembali isian pengajuan." };
  }

  let photos: PreparedPhoto[] = [];
  try {
    photos = await prepareMaintenancePhotos(files, asset.code);
  } catch (error) {
    const message = error instanceof PhotoError ? error.message : "Foto gagal diunggah. Silakan coba lagi.";
    return { errors: { photos: message }, message };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const request = await tx.assetApprovalRequest.create({
        data: {
          transactionType: ApprovalTransactionType.MAINTENANCE,
          assetId: asset.id,
          requesterId: user.id,
          payload: {
            assetId: asset.id,
            description,
            status: "OPEN",
            scheduledDate: null,
            completedDate: null,
            cost: null,
            vendor: null,
            notes: notes || null,
          },
        },
      });
      await attachMaintenancePhotos(tx, photos, { assetId: asset.id, approvalRequestId: request.id });
    });
  } catch {
    await discardMaintenancePhotos(photos);
    return { message: "Pengajuan maintenance gagal dikirim. Silakan coba lagi." };
  }

  revalidatePath("/dashboard/my-class");
  revalidatePath(`/dashboard/my-class/${asset.id}`);
  revalidatePath("/dashboard/approvals");
  revalidatePath("/dashboard/maintenance");
  return { ok: true, message: "Pengajuan maintenance terkirim dan menunggu approval." };
}
