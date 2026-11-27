import { redirect } from "next/navigation";

/** Replaced by the printable sheet at /print/qr-labels (smaller labels, filters, no sidebar on paper). */
export default function QrLabelsPage() {
  redirect("/print/qr-labels");
}
