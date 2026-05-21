import { Inbox } from "lucide-react";

type EmptyStateProps = {
  title?: string;
  description?: string;
};

export function EmptyState({
  title = "Belum ada data.",
  description = "Data akan tampil di sini setelah modul terhubung.",
}: EmptyStateProps) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-center text-[var(--muted)]">
      <Inbox className="h-8 w-8 text-[#8a97b3]" aria-hidden="true" />
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="max-w-md text-xs">{description}</p>
    </div>
  );
}
