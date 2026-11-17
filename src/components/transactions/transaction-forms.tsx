"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  completeMaintenanceAction,
  createAuditAction,
  createDisposalAction,
  createMaintenanceAction,
  createMovementAction,
  deleteMaintenanceAction,
  requestDisposalReversalAction,
  updateMaintenanceAction,
  type TransactionActionState,
} from "@/app/(dashboard)/dashboard/transactions/transaction-actions";
import { FieldError } from "@/components/master/master-form-feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActionFeedback } from "@/components/ui/toast-provider";
import { useFormAction } from "@/components/ui/use-form-action";

export type SelectOption = {
  id: string;
  label: string;
};

const initialState: TransactionActionState = {};

function Feedback({ state }: { state: TransactionActionState }) {
  useActionFeedback(state);
  return null;
}

function AssetSelect({ assets, error }: { assets: SelectOption[]; error?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--text)]">Asset</span>
      <Select name="assetId" className="mt-2" required>
        <option value="">Pilih asset</option>
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.label}
          </option>
        ))}
      </Select>
      <FieldError message={error} />
    </label>
  );
}

function OptionSelect({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: SelectOption[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      <Select name={name} className="mt-2">
        <option value="">Tidak diubah</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

export function MovementForm({
  assets,
  departments,
  locations,
  users,
}: {
  assets: SelectOption[];
  departments: SelectOption[];
  locations: SelectOption[];
  users: SelectOption[];
}) {
  const [state, form, pending] = useFormAction(createMovementAction, initialState);

  return (
    <form {...form} className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <AssetSelect assets={assets} error={state.errors?.assetId} />
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Performed At</span>
          <Input name="performedAt" type="date" className="mt-2" />
          <FieldError message={state.errors?.performedAt} />
        </label>
        <OptionSelect label="To Location" name="toLocationId" options={locations} />
        <OptionSelect label="To Department" name="toDepartmentId" options={departments} />
        <OptionSelect label="To Asset User" name="toAssetUserId" options={users} />
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Notes</span>
          <Textarea name="notes" className="mt-2" rows={3} />
        </label>
      </div>
      <FieldError message={state.errors?.destination} />
      <Button type="submit" disabled={pending}>
        <Plus className="h-4 w-4" />
        {pending ? "Menyimpan..." : "Tambah Movement"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function DisposalForm({ assets }: { assets: SelectOption[] }) {
  const [state, form, pending] = useFormAction(createDisposalAction, initialState);

  return (
    <form {...form} className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
      <div>
        <h2 className="font-semibold text-[var(--text)]">Ajukan Disposal Aset</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Pilih aset dan jelaskan alasan aset dikeluarkan. Status aset baru berubah menjadi Disposed setelah request disetujui.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <AssetSelect assets={assets} error={state.errors?.assetId} />
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Tanggal Disposal</span>
          <Input name="disposedAt" type="date" className="mt-2" />
          <FieldError message={state.errors?.disposedAt} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[var(--text)]">Alasan Disposal</span>
          <Textarea name="reason" className="mt-2" rows={3} placeholder="Contoh: rusak permanen dan tidak layak diperbaiki" required />
          <FieldError message={state.errors?.reason} />
        </label>
      </div>
      <FieldError message={state.errors?.status} />
      <Button type="submit" disabled={pending} variant="warning">
        <Plus className="h-4 w-4" />
        {pending ? "Mengirim..." : "Ajukan Disposal"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function ReverseDisposalButton({ disposalId, assetLabel, disabled }: { disposalId: string; assetLabel: string; disabled: boolean }) {
  const [state, form, pending] = useFormAction(requestDisposalReversalAction, initialState);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state.ok) setOpen(false); }, [state]);

  return (
    <>
      <Button type="button" size="sm" variant="warning" disabled={disabled || pending} onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" />
        Batalkan Disposal
      </Button>
      {open ? (
        <form {...form}>
          <ConfirmDialog
            title="Ajukan pembatalan disposal?"
            description={`Pembatalan disposal ${assetLabel} akan dikirim ke Approvals. Status aset baru kembali setelah pengajuan disetujui.`}
            confirmLabel="Ajukan Pembatalan"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="disposalId" type="hidden" value={disposalId} />
            <label className="block">
              <span className="text-sm font-medium text-[var(--text)]">Alasan Pembatalan <span className="text-[var(--danger)]">*</span></span>
              <Textarea
                name="reason"
                className="mt-2"
                rows={3}
                maxLength={500}
                required
                placeholder="Contoh: aset ternyata masih bisa diperbaiki dan dipakai kembali"
                disabled={pending}
              />
              <FieldError message={state.errors?.reason} />
            </label>
            <Feedback state={state} />
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

export function AuditForm({ assets, locations }: { assets: SelectOption[]; locations: SelectOption[] }) {
  const [state, form, pending] = useFormAction(createAuditAction, initialState);

  return (
    <form {...form} className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <AssetSelect assets={assets} error={state.errors?.assetId} />
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Status</span>
          <Select name="status" className="mt-2" required>
            <option value="">Pilih status</option>
            <option value="MATCHED">MATCHED</option>
            <option value="MISSING">MISSING</option>
            <option value="DAMAGED">DAMAGED</option>
          </Select>
          <FieldError message={state.errors?.status} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Audited At</span>
          <Input name="auditedAt" type="date" className="mt-2" />
          <FieldError message={state.errors?.auditedAt} />
        </label>
        <OptionSelect label="Audit Location" name="locationId" options={locations} />
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[var(--text)]">Notes</span>
          <Textarea name="notes" className="mt-2" rows={3} />
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        <Plus className="h-4 w-4" />
        {pending ? "Menyimpan..." : "Tambah Audit"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function MaintenanceCreateForm({ assets }: { assets: SelectOption[] }) {
  const [state, form, pending] = useFormAction(createMaintenanceAction, initialState);

  return (
    <form {...form} className="space-y-4 rounded-lg border border-[var(--border)] bg-white p-5">
      <MaintenanceFields assets={assets} state={state} />
      <Button type="submit" disabled={pending}>
        <Plus className="h-4 w-4" />
        {pending ? "Menyimpan..." : "Tambah Maintenance"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

function MaintenanceFields({
  assets,
  defaults,
  state,
}: {
  assets?: SelectOption[];
  defaults?: Record<string, string | null>;
  state: TransactionActionState;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {assets ? <AssetSelect assets={assets} error={state.errors?.assetId} /> : null}
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Status</span>
        <Select name="status" defaultValue={defaults?.status ?? "OPEN"} className="mt-2" required>
          <option value="OPEN">OPEN</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </Select>
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-medium text-[var(--text)]">Description</span>
        <Textarea name="description" defaultValue={defaults?.description ?? ""} className="mt-2" rows={3} required />
        <FieldError message={state.errors?.description} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Scheduled Date</span>
        <Input name="scheduledDate" type="date" defaultValue={defaults?.scheduledDate ?? ""} className="mt-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Completed Date</span>
        <Input name="completedDate" type="date" defaultValue={defaults?.completedDate ?? ""} className="mt-2" />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Cost</span>
        <Input name="cost" type="number" min="0" step="0.01" defaultValue={defaults?.cost ?? ""} className="mt-2" />
        <FieldError message={state.errors?.cost} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Vendor</span>
        <Input name="vendor" defaultValue={defaults?.vendor ?? ""} className="mt-2" />
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-medium text-[var(--text)]">Notes</span>
        <Textarea name="notes" defaultValue={defaults?.notes ?? ""} className="mt-2" rows={2} />
      </label>
    </div>
  );
}

export function MaintenanceEditForm({
  maintenance,
}: {
  maintenance: {
    completedDate: string;
    cost: string;
    description: string;
    id: string;
    notes: string;
    scheduledDate: string;
    status: string;
    vendor: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [state, form, pending] = useFormAction(updateMaintenanceAction, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Edit
      </Button>
    );
  }

  return (
    <form {...form} className="mt-3 space-y-4 rounded-md border border-[var(--border)] bg-[var(--table-head)] p-4">
      <input name="id" type="hidden" value={maintenance.id} />
      <MaintenanceFields defaults={maintenance} state={state} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          <Save className="h-4 w-4" />
          Simpan
        </Button>
        <Button type="button" size="sm" variant="secondary" onClick={() => setOpen(false)}>
          Batal
        </Button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function MaintenanceCompleteButton({ maintenance }: { maintenance: Record<string, string> }) {
  const [state, form, pending] = useFormAction(completeMaintenanceAction, initialState);

  if (maintenance.status === "COMPLETED") return null;

  return (
    <form {...form} className="space-y-2">
      {Object.entries(maintenance).map(([key, value]) => (
        <input key={key} name={key} type="hidden" value={value} />
      ))}
      <Button type="submit" size="sm" variant="success" disabled={pending}>
        <CheckCircle2 className="h-4 w-4" />
        Complete
      </Button>
      <Feedback state={state} />
    </form>
  );
}

export function MaintenanceDeleteButton({ id }: { id: string }) {
  const [state, form, pending] = useFormAction(deleteMaintenanceAction, initialState);
  const [open, setOpen] = useState(false);
  useEffect(() => { if (state.ok) setOpen(false); }, [state.ok]);

  return (
    <><Button type="button" size="sm" variant="danger" disabled={pending} onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Hapus
      </Button>
      {open ? <form {...form}><ConfirmDialog title="Hapus maintenance?" description="Apakah Anda yakin ingin menghapus data maintenance ini? Tindakan ini tidak dapat dibatalkan." confirmLabel="Hapus" pending={pending} onCancel={() => setOpen(false)}><input name="id" type="hidden" value={id} /><Feedback state={state} /></ConfirmDialog></form> : null}</>
  );
}
