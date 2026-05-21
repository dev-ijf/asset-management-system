"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type MasterRecordFormProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
};

export function MasterRecordForm({ title, description, children, footer, onClose }: MasterRecordFormProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-xl rounded-lg border border-[var(--border)] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
            {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
            type="button"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4 px-6 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          {footer}
        </div>
      </div>
    </div>
  );
}
