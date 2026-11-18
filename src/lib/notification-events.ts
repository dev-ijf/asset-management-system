/** Dispatch on window to make the topbar re-read its notification counts right away. */
export const REFRESH_NOTIFICATIONS_EVENT = "ams:refresh-notifications";

export function refreshNotifications() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REFRESH_NOTIFICATIONS_EVENT));
}
