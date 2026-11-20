import { Prisma } from "@/generated/prisma/client";

/** Days ahead the dashboard and the daily alert treat a warranty as "akan habis". */
export const WARRANTY_ALERT_DAYS = 30;

/**
 * Warranty end = purchase date + duration in months (date-only, 00:00 UTC of its day).
 * A day that does not exist in the target month falls back to that month's last day
 * (31 Jan + 1 bulan = 28/29 Feb), the same rule PostgreSQL uses for `date + interval`.
 */
export function warrantyEndDate(purchaseDate: Date | null, durationMonths: number | null | undefined) {
  if (!purchaseDate || !durationMonths) return null;

  const year = purchaseDate.getUTCFullYear();
  const month = purchaseDate.getUTCMonth() + durationMonths;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  return new Date(Date.UTC(year, month, Math.min(purchaseDate.getUTCDate(), lastDay)));
}

type WarrantyClient = { warranty: { findUnique: (args: { where: { id: string }; select: { durationMonths: true } }) => Promise<{ durationMonths: number } | null> } };

/** Looks up the warranty duration and returns the end date to store on the asset. */
export async function resolveWarrantyEnd(db: WarrantyClient, warrantyId: string | null, purchaseDate: Date | null) {
  if (!warrantyId || !purchaseDate) return null;
  const warranty = await db.warranty.findUnique({ where: { id: warrantyId }, select: { durationMonths: true } });
  return warrantyEndDate(purchaseDate, warranty?.durationMonths);
}

/** Recomputes warranty_end of every asset using this warranty, after its duration changed. */
export function recomputeWarrantyEndSql(warrantyId: string, durationMonths: number) {
  return Prisma.sql`
    UPDATE assets
    SET warranty_end = (purchase_date + make_interval(months => ${durationMonths}))::date
    WHERE warranty_id = ${warrantyId}::uuid AND purchase_date IS NOT NULL`;
}
