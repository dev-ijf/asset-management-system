"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { restoreAssetsAction } from "@/app/(dashboard)/dashboard/archive/actions";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast-provider";

export function ArchiveTable({ canManage, columns, rows, ids, codes }: { canManage: boolean; columns: string[]; rows: ReactNode[][]; ids: string[]; codes: string[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();
  const selectAll = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const all = ids.length > 0 && ids.every((id) => selected.includes(id));
  useEffect(() => { if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && !all; }, [all, selected.length]);

  function restore() {
    if (!confirmIds) return;
    startTransition(async () => {
      const result = await restoreAssetsAction(confirmIds);
      if (result.error) return showToast(result.error, "error");
      showToast(result.message ?? "Aset berhasil dipulihkan.", "success");
      setSelected([]); setConfirmIds(null); router.refresh();
    });
  }

  const actionColumn = "Aksi";
  const renderedRows = rows.map((row, index) => [
    ...(canManage ? [<input key={ids[index]} type="checkbox" aria-label={`Pilih ${codes[index]}`} checked={selected.includes(ids[index])} onChange={(event) => setSelected(event.target.checked ? [...selected, ids[index]] : selected.filter((id) => id !== ids[index]))} />] : []),
    ...row,
    ...(canManage ? [<Button key="restore" size="sm" variant="secondary" onClick={() => setConfirmIds([ids[index]])}><RotateCcw className="h-4 w-4" />Pulihkan</Button>] : []),
  ]);

  return <>
    {canManage ? <div className="mb-4 flex flex-wrap items-center gap-3 text-sm"><span aria-live="polite">{selected.length} aset dipilih</span><Button variant="secondary" disabled={!selected.length} onClick={() => setConfirmIds(selected)}><RotateCcw className="h-4 w-4" />Pulihkan Terpilih</Button></div> : null}
    <DataTable columns={[...(canManage ? [<input key="all" ref={selectAll} type="checkbox" aria-label="Pilih semua aset pada halaman ini" checked={all} onChange={(event) => setSelected(event.target.checked ? ids : [])} />] : []), ...columns, ...(canManage ? [actionColumn] : [])]} rows={renderedRows} />
    {confirmIds ? <ConfirmDialog title="Pulihkan Aset?" description={`${confirmIds.length} aset akan dikembalikan ke daftar aset aktif dengan data, foto, dan riwayat tetap utuh.`} confirmLabel="Pulihkan" pending={pending} onCancel={() => setConfirmIds(null)} onConfirm={restore} /> : null}
  </>;
}
