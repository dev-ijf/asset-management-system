/**
 * The app runs on UTC servers (Vercel) but its users work in WIB, so every date shown or
 * bucketed by day must use Asia/Jakarta explicitly. Safe to import from client components.
 */

export const APP_TIME_ZONE = "Asia/Jakarta";

/** Asia/Jakarta is UTC+7 all year (no daylight saving). */
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Intl.DateTimeFormat in id-ID and WIB. Formats that show the time also print "WIB"
 * so a reader never has to guess the zone.
 */
export function wibFormat(options: Intl.DateTimeFormatOptions = {}) {
  const showsTime = options.hour !== undefined || options.minute !== undefined;
  const zoneName = showsTime && !options.timeStyle && !options.timeZoneName ? { timeZoneName: "short" as const } : {};
  return new Intl.DateTimeFormat("id-ID", { ...options, ...zoneName, timeZone: APP_TIME_ZONE });
}

/** YYYY-MM-DD of the WIB calendar day that contains `date`. */
export function wibDayKey(date: Date) {
  return new Date(date.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** The instant 00:00 WIB of the day `key` (YYYY-MM-DD). */
export function wibMidnight(key: string) {
  return new Date(Date.parse(`${key}T00:00:00.000Z`) - WIB_OFFSET_MS);
}

/** The instant 00:00 WIB of the day that contains `date`. */
export function startOfWibDay(date: Date) {
  return wibMidnight(wibDayKey(date));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

/**
 * Today's WIB date in the convention of date-only columns (purchase, movement, disposal dates):
 * 00:00 UTC of that calendar day.
 */
export function todayDateOnly(now = new Date()) {
  return new Date(`${wibDayKey(now)}T00:00:00.000Z`);
}

/** True when a date-only value (00:00 UTC of its day) is after today in WIB. */
export function isFutureDate(date: Date, now = new Date()) {
  return date.getTime() > todayDateOnly(now).getTime();
}

/** Today in WIB as YYYY-MM-DD, for the `max` attribute of date inputs. */
export function todayInputValue(now = new Date()) {
  return wibDayKey(now);
}

export const FUTURE_DATE_MESSAGE = "tidak boleh melebihi hari ini.";
