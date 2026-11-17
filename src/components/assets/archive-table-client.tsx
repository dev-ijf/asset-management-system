"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { permanentDeleteAssetsAction, restoreAssetsAction } from "@/app/(dashboard)/dashboard/archive/actions";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";

type Pending = { kind: "restore" | "delete"; ids: string[] } | null;

const CONFIRM_WORD = "HAPUS";

export function ArchiveTable({ canManage, columns, rows, ids, codes }: { canManage: boolean; columns: string[]; rows: ReactNode[][]; ids: string[]; codes: string[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState<Pending>(null);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const selectAll = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { showToast } = useToast();
  const all = ids.length > 0 && ids.every((id) => selected.includes(id));

  useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = selected.length > 0 && !all;
  }, [all, selected.length]);

  // Drop selections that are no longer on this page (after refresh, paging or filtering).
  useEffect(() => {
    setSelected((current) => current.filter((id) => ids.includes(id)));
  }, [ids]);

  function open(kind: "restore" | "delete", targetIds: string[]) {
    setTyped("");
    setConfirm({ kind, ids: targetIds });
  }

  function close() {
    if (pending) return;
    setConfirm(null);
    setTyped("");
  }

  function run() {
    if (!confirm) return;
    if (confirm.kind === "delete" && typed.trim().toUpperCase() !== CONFIRM_WORD) {
      showToast(`Ketik ${CONFIRM_WORD} untuk mengonfirmasi hapus permanen.`, "error");
      return;
    }
    const target = confirm;
    startTransition(async () => {
      const result = target.kind === "restore"
        ? await restoreAssetsAction(target.ids)
        : await permanentDeleteAssetsAction(target.ids, typed);
      if (result.error) {
        showToast(result.error, "error");
        return;
      }
      showToast(result.message ?? "Berhasil.", "success");
      setSelected([]);
      setConfirm(null);
      setTyped("");
      router.refresh();
    });
  }

  const label = (targetIds: string[]) =>
    targetIds.length === 1 ? `aset ${codes[ids.indexOf(targetIds[0])] ?? ""}`.trim() : `${targetIds.length} aset`;

  const renderedRows = rows.map((row, index) => [
    ...(canManage
      ? [
          <input
            key={ids[index]}
            type="checkbox"
            aria-label={`Pilih ${codes[index]}`}
            checked={selected.includes(ids[index])}
            onChange={(event) =>
              setSelected(event.target.checked ? [...selected, ids[index]] : selected.filter((id) => id !== ids[index]))
            }
          />,
        ]
      : []),
    ...row,
    ...(canManage
      ? [
          <div key="actions" className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => open("restore", [ids[index]])}>
              <RotateCcw className="h-4 w-4" />
              Pulihkan
            </Button>
            <Button size="sm" variant="danger" onClick={() => open("delete", [ids[index]])}>
              <Trash2 className="h-4 w-4" />
              Hapus Permanen
            </Button>
          </div>,
        ]
      : []),
  ]);

  return (
    <>
      {canManage ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span aria-live="polite">{selected.length} aset dipilih</span>
          <Button variant="secondary" disabled={!selected.length} onClick={() => open("restore", selected)}>
            <RotateCcw className="h-4 w-4" />
            Pulihkan Terpilih
          </Button>
          <Button variant="danger" disabled={!selected.length} onClick={() => open("delete", selected)}>
            <Trash2 className="h-4 w-4" />
            Hapus Permanen Terpilih
          </Button>
        </div>
      ) : null}
      <DataTable
        columns={[
          ...(canManage
            ? [
                <input
                  key="all"
                  ref={selectAll}
                  type="checkbox"
                  aria-label="Pilih semua aset pada halaman ini"
                  checked={all}
                  onChange={(event) => setSelected(event.target.checked ? ids : [])}
                />,
              ]
            : []),
          ...columns,
          ...(canManage ? ["Aksi"] : []),
        ]}
        rows={renderedRows}
      />
      {confirm?.kind === "restore" ? (
        <ConfirmDialog
          title="Pulihkan Aset?"
          description={`${label(confirm.ids)} akan dikembalikan ke daftar aset aktif dengan data, foto, dan riwayat tetap utuh.`}
          confirmLabel="Pulihkan"
          pending={pending}
          onCancel={close}
          onConfirm={run}
        />
      ) : null}
      {confirm?.kind === "delete" ? (
        <ConfirmDialog
          title="Hapus Permanen?"
          description={`${label(confirm.ids)} akan dihapus selamanya beserta foto, riwayat, dan semua transaksinya (movement, disposal, audit, maintenance, approval). Tindakan ini tidak bisa dibatalkan.`}
          confirmLabel="Hapus Permanen"
          pending={pending}
          onCancel={close}
          onConfirm={run}
        >
          <label className="block text-sm">
            <span className="text-[var(--muted)]">
              Ketik <strong className="text-[var(--text)]">{CONFIRM_WORD}</strong> untuk melanjutkan
            </span>
            <Input
              className="mt-2"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              disabled={pending}
              autoComplete="off"
              aria-label={`Ketik ${CONFIRM_WORD} untuk konfirmasi`}
            />
          </label>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
