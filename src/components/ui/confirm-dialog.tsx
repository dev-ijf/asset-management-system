"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title?: string;
  description?: string;
  open?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  pending?: boolean;
  children?: ReactNode;
  onCancel?: () => void;
  onConfirm?: () => void;
};

export function ConfirmDialog({
  title = "Konfirmasi tindakan",
  description = "Tindakan ini perlu dikonfirmasi terlebih dahulu.",
  open = true,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  pending = false,
  children,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4" onKeyDown={(event) => { if (event.key === "Escape" && !pending) onCancel?.(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" className="w-full max-w-md rounded-lg border border-[var(--border)] bg-white p-5 shadow-xl">
        <h3 id="confirm-title" className="text-base font-semibold text-[var(--text)]">{title}</h3>
        <p id="confirm-description" className="mt-2 text-sm text-[var(--muted)]">{description}</p>
        <div className="mt-5">{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button autoFocus variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button type={onConfirm ? "button" : "submit"} onClick={onConfirm} variant="danger" size="sm" disabled={pending}>
            {pending ? (confirmLabel === "Hapus" ? "Menghapus..." : "Memproses...") : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
