"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import type { BulkMode, BulkPreview } from "@/lib/asset-bulk-format";
import { previewAssetBulkAction, previewAssetDeleteAction, confirmAssetBulkAction, downloadAssetBulkTemplateAction, downloadAssetBulkReportAction } from "@/app/(dashboard)/dashboard/assets/bulk-actions";

type Context = { selected: string[]; setSelected: (ids: string[]) => void; open: (mode: BulkMode) => void; canManage: boolean };
const BulkContext = createContext<Context | null>(null);
function useBulk() {
  const value = useContext(BulkContext);
  if (!value) throw new Error("Bulk provider missing");
  return value;
}
function saveExcel(base64: string, name: string) {
  const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function AssetBulkProvider({ children, canManage }: { children: ReactNode; canManage: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<BulkMode | null>(null);
  return <BulkContext.Provider value={{ selected, setSelected, canManage, open: setMode }}>
    {children}
    {mode && canManage ? <BulkModal mode={mode} ids={selected} onClose={() => setMode(null)} onComplete={() => setSelected([])} /> : null}
  </BulkContext.Provider>;
}
export function AssetImportButton() {
  const { open, canManage } = useBulk();
  return canManage ? <Button variant="secondary" onClick={() => open("IMPORT")}><Upload className="h-4 w-4" />Import Asset</Button> : null;
}
export function AssetBulkTable({ columns, rows, ids, codes }: { columns: string[]; rows: ReactNode[][]; ids: string[]; codes: string[] }) {
  const { selected, setSelected, open, canManage } = useBulk();
  const visible = selected.filter(id => ids.includes(id));
  const all = ids.length > 0 && ids.slice(0, 200).every(id => visible.includes(id));
  const selectAll = useRef<HTMLInputElement>(null);
  useEffect(() => { if (selectAll.current) selectAll.current.indeterminate = visible.length > 0 && !all; }, [visible.length, all]);
  if (!canManage) return <DataTable columns={columns} rows={rows} />;
  return <>
    <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
      <span aria-live="polite">{visible.length} Asset Selected</span>
      <Button variant="secondary" disabled={!visible.length} onClick={() => open("UPDATE")}>Bulk Update</Button>
      <Button variant="danger" disabled={!visible.length} onClick={() => open("DELETE")}>Delete Selected</Button>
      {ids.length > 200 ? <span className="text-[var(--muted)]">Maksimal 200 pilihan; Select All memilih 200 baris pertama.</span> : null}
    </div>
    <DataTable columns={[<input key="select" ref={selectAll} type="checkbox" aria-label="Select All" checked={all} disabled={!ids.length}
      onChange={event => setSelected(event.target.checked ? ids.slice(0, 200) : [])} />, ...columns]}
      rows={rows.map((row, index) => [<input key={ids[index]} type="checkbox" aria-label={`Pilih ${codes[index]}`} checked={visible.includes(ids[index])}
        disabled={!visible.includes(ids[index]) && visible.length >= 200}
        onChange={event => setSelected(event.target.checked ? [...visible, ids[index]] : visible.filter(id => id !== ids[index]))} />, ...row])} />
  </>;
}
function BulkModal({ mode, ids, onClose, onComplete }: { mode: BulkMode; ids: string[]; onClose: () => void; onComplete: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  useEffect(() => { dialog.current?.showModal(); }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true); setError("");
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : "Proses gagal. Coba kembali."); }
    finally { setBusy(false); }
  }
  function choose(next: File | undefined) {
    setPreview(null); setError(""); setFile(null);
    if (!next) return;
    if (!/\.(xlsx|csv)$/i.test(next.name) || next.size > 2 * 1024 * 1024 || !next.size) { setError("Gunakan file .xlsx/.csv, maksimal 2 MB, tidak kosong."); return; }
    setFile(next);
  }
  const ready = preview?.rows.filter(r => r.result === "Ready").length || 0;
  async function makePreview() {
    await run(async () => {
      const form = new FormData();
      form.set("mode", mode); form.set("ids", JSON.stringify(ids));
      if (file) form.set("file", file);
      const result = mode === "DELETE" ? await previewAssetDeleteAction(ids) : await previewAssetBulkAction(form);
      if (result.error) throw new Error(result.error);
      setPreview(result.data!);
    });
  }
  async function confirm() {
    if (!preview) return;
    await run(async () => {
      const result = await confirmAssetBulkAction(preview.id);
      if (result.error) throw new Error(result.error);
      setPreview(result.data!); onComplete(); router.refresh();
    });
  }
  const title = mode === "IMPORT" ? "Import Asset" : mode === "UPDATE" ? "Bulk Update Asset" : "Delete Selected Assets";
  return <dialog ref={dialog} aria-labelledby="bulk-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="m-auto max-h-[90vh] w-[calc(100%-32px)] max-w-5xl overflow-y-auto rounded-lg border border-[var(--border)] bg-white p-6 text-[var(--text)] shadow-xl backdrop:bg-black/30">
    <div className="mb-5 flex items-center justify-between"><h2 id="bulk-title" className="text-lg font-semibold">{title}</h2><Button variant="ghost" aria-label="Tutup" disabled={busy} onClick={onClose}><X className="h-5 w-5" /></Button></div>
    {error ? <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-[var(--danger)]">{error}</p> : null}
    {mode === "DELETE" ? <p className="mb-4 text-sm">Are you sure you want to delete selected assets? You are deleting {preview?.rows.length ?? ids.length} assets. Penghapusan menggunakan soft delete; foto dan riwayat tetap tersimpan.</p> : !preview?.completed ? <>
      <Button variant="secondary" disabled={busy} onClick={() => run(async () => {
        const result = await downloadAssetBulkTemplateAction(mode, ids);
        if (result.error) throw new Error(result.error);
        saveExcel(result.data!, mode === "IMPORT" ? "Import_Asset_Template.xlsx" : "Update_Asset_Template.xlsx");
      })}><Download className="h-4 w-4" />{mode === "IMPORT" ? "Download Template Import" : "Download Template Update"}</Button>
      <p className="my-3 text-sm text-[var(--muted)]">{mode === "UPDATE" ? "Download template berisi asset pilihan, edit nilainya, lalu upload. Kolom opsional kosong akan dikosongkan; hapus kolom untuk mempertahankan nilainya." : "Isi template dan upload untuk validasi. Data lama tidak akan ditimpa."} Maksimal 200 baris, 2 MB.</p>
      <label className={`mb-4 block rounded-lg border-2 border-dashed p-6 text-center text-sm ${dragging ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)]"}`}
        onDragOver={event => { event.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={event => { event.preventDefault(); setDragging(false); if (!busy) choose(event.dataTransfer.files[0]); }}>
        <span className="mb-3 block">Tarik file Excel/CSV ke sini atau pilih dari perangkat</span>
        <input aria-label="File import asset" type="file" accept=".xlsx,.csv" disabled={busy} onChange={event => choose(event.target.files?.[0])} className="max-w-full" />
        {file ? <span className="mt-2 block break-all font-medium">{file.name}</span> : null}
      </label>
    </> : null}
    {preview ? <>
      <h3 className="mb-3 font-semibold">{preview.completed ? `${mode === "IMPORT" ? "Import" : mode === "UPDATE" ? "Update" : "Delete"} Completed` : "Preview — belum ada data yang diubah"}</h3>
      <div aria-live="polite" className="mb-4 flex flex-wrap gap-4 rounded-md bg-[var(--primary-soft)] p-3 text-sm">
        <span>Total Rows: {preview.rows.length}</span>
        <span>{preview.completed ? "Successfully Processed" : "Ready to Import / Process"}: {preview.completed ? preview.rows.filter(r => r.result === "Success").length : ready}</span>
        <span>Skipped Duplicate: {preview.rows.filter(r => r.result === "Duplicate").length}</span>
        <span>Failed Validation: {preview.rows.filter(r => r.result === "Invalid").length}</span>
        <span>Failed Processing: {preview.rows.filter(r => r.result === "Failed").length}</span>
      </div>
      <div className="max-h-80 overflow-auto"><DataTable columns={["Row", "Asset Code", "Asset Name", "Result", "Reason / Changes"]} rows={preview.rows.map(row => [row.row, row.code, row.name, row.result,
        <div key={row.row} className="min-w-60"><p>{row.reason || "—"}</p>{row.changes.map(change => <p key={change.field} className="mt-1 text-xs"><strong>{change.field}:</strong> {change.before} → {change.after}</p>)}</div>])} /></div>
      <Button className="mt-4" variant="secondary" disabled={busy} onClick={() => run(async () => {
        const result = await downloadAssetBulkReportAction(preview.id);
        if (result.error) throw new Error(result.error);
        saveExcel(result.data!, "Import_Result.xlsx");
      })}><Download className="h-4 w-4" />Download Error Report</Button>
    </> : null}
    <div className="mt-5 flex justify-end gap-2">
      <Button variant="secondary" disabled={busy} onClick={onClose}>{preview?.completed ? "Tutup" : "Cancel"}</Button>
      {!preview ? <Button disabled={busy || (mode !== "DELETE" && !file)} onClick={makePreview}>{busy ? "Memvalidasi..." : "Preview & Validasi"}</Button> : !preview.completed ? <Button variant={mode === "DELETE" ? "danger" : "primary"} disabled={busy || !ready} onClick={confirm}>{busy ? "Memproses..." : mode === "DELETE" ? `Delete ${ready} Assets` : mode === "UPDATE" ? `Confirm Update (${ready})` : `Import (${ready})`}</Button> : null}
    </div>
  </dialog>;
}
