import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AssetHistoryAction =
  | "CREATED"
  | "UPDATED"
  | "ARCHIVED"
  | "DELETED"
  | "PHOTO_UPLOADED"
  | "PHOTO_DELETED"
  | "PRIMARY_PHOTO_CHANGED"
  | "MOVED"
  | "DISPOSED"
  | "DISPOSAL_REVERSED"
  | "AUDITED"
  | "MAINTENANCE_CREATED"
  | "MAINTENANCE_UPDATED"
  | "MAINTENANCE_COMPLETED";

type HistoryClient = typeof prisma | Prisma.TransactionClient;

export async function createAssetHistory({
  action,
  assetId,
  changedById,
  description,
  payload,
  tx = prisma,
}: {
  action: AssetHistoryAction;
  assetId: string;
  changedById?: string | null;
  description?: string | null;
  payload?: Prisma.InputJsonValue;
  tx?: HistoryClient;
}) {
  return tx.assetHistory.create({
    data: {
      action,
      assetId,
      changedById: changedById || null,
      description: description || null,
      payload: payload ?? Prisma.JsonNull,
    },
  });
}
