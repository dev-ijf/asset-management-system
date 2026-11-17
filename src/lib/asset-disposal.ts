import type { Prisma } from "@/generated/prisma/client";

export const ACTIVE_STATUS_CODE = "ACTIVE";
export const DISPOSED_STATUS_CODE = "DISPOSED";
/** Status codes the disposal workflow depends on; they cannot be deleted or re-coded in master data. */
export const SYSTEM_STATUS_CODES = [ACTIVE_STATUS_CODE, DISPOSED_STATUS_CODE] as const;

/** Business-rule failure whose message is safe to show to the user. */
export class DisposalRuleError extends Error {}

type DB = Prisma.TransactionClient;

/**
 * Locks the asset row until the surrounding transaction ends.
 * Every disposal, reverse, and approval for the same asset takes this lock first,
 * so their "is there already an active disposal?" checks cannot interleave.
 */
export async function lockAsset(tx: DB, assetId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM assets WHERE id = ${assetId}::uuid FOR UPDATE`;

  if (rows.length === 0) {
    throw new DisposalRuleError("Asset tidak ditemukan.");
  }
}

export async function findStatusIdByCode(db: DB, code: string) {
  const status = await db.assetStatus.findUnique({ where: { code }, select: { id: true } });

  return status?.id ?? null;
}

export async function findActiveDisposal(db: DB, assetId: string) {
  return db.assetDisposal.findFirst({ where: { assetId, reversedAt: null }, select: { id: true } });
}

export async function findPendingDisposalRequest(db: DB, assetId: string) {
  return db.assetApprovalRequest.findFirst({
    where: { assetId, transactionType: "DISPOSAL", status: "PENDING" },
    select: { id: true },
  });
}

/**
 * DISPOSED is owned by the disposal workflow: it is set only when a disposal is approved
 * and cleared only by Reverse Disposal. Returns an error message when a manual edit,
 * import, or bulk update tries to cross that boundary.
 */
export function statusChangeError(
  currentStatusId: string | null | undefined,
  nextStatusId: string | null | undefined,
  disposedStatusId: string | null,
) {
  if (!disposedStatusId || nextStatusId === undefined || nextStatusId === currentStatusId) {
    return null;
  }

  if (currentStatusId === disposedStatusId) {
    return "Status asset yang sudah disposal hanya bisa diubah lewat Reverse Disposal.";
  }

  if (nextStatusId === disposedStatusId) {
    return "Status DISPOSED hanya bisa diset lewat transaksi disposal yang disetujui.";
  }

  return null;
}
