import { FUTURE_DATE_MESSAGE, isFutureDate, todayDateOnly } from "@/lib/datetime";

export const MAINTENANCE_STATUSES = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];

/**
 * Statuses a new request may carry. A request is work still to be done: it is completed
 * afterwards with the Complete button, so it cannot start as COMPLETED or CANCELLED.
 */
export const REQUEST_STATUSES: readonly MaintenanceStatus[] = ["OPEN", "IN_PROGRESS"];

export function isMaintenanceStatus(value: string): value is MaintenanceStatus {
  return (MAINTENANCE_STATUSES as readonly string[]).includes(value);
}

const dayFormat = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Date rules of a maintenance record. Dates are date-only (00:00 UTC of their day);
 * `requestedAt` is the instant the request was submitted (maintenance.createdAt).
 *
 * The scheduled date is only the plan, so finishing earlier than scheduled is allowed.
 * Finishing before the work was even requested, or in the future, is not.
 */
export function maintenanceDateErrors(input: {
  status: string;
  completedDate: Date | null;
  requestedAt: Date | null;
}) {
  const errors: { completedDate?: string } = {};
  const { status, completedDate, requestedAt } = input;

  if (!completedDate) return errors;

  const requestedDay = requestedAt ? todayDateOnly(requestedAt) : null;

  if (status !== "COMPLETED") {
    errors.completedDate = "Completed date hanya diisi jika status COMPLETED.";
  } else if (isFutureDate(completedDate)) {
    errors.completedDate = `Completed date ${FUTURE_DATE_MESSAGE}`;
  } else if (requestedDay && completedDate < requestedDay) {
    errors.completedDate = `Completed date tidak boleh sebelum tanggal request diajukan (${dayFormat.format(requestedDay)}).`;
  }

  return errors;
}
