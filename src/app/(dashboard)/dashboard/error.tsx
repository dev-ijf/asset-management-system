"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown instead of a blank "Application error" page when a dashboard page fails on the server,
 * e.g. the database connection drops for a moment. "Coba lagi" re-renders the page; the digest
 * matches the entry in the server (Vercel) logs.
 */
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mt-10 max-w-xl rounded-lg border border-[rgba(255,91,82,0.35)] bg-[#ffecea] p-6 text-[var(--danger)]">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-3">
          <div>
            <p className="font-semibold">Halaman gagal dimuat.</p>
            <p className="mt-1 text-sm">
              Biasanya karena koneksi ke database terputus sesaat. Coba muat ulang; jika masih gagal, hubungi administrator
              dan sertakan kode di bawah.
            </p>
          </div>
          {error.digest ? <p className="text-xs text-[var(--muted)]">Kode error: {error.digest}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Coba lagi
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center rounded-md border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--text)] hover:bg-slate-50"
            >
              Ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
