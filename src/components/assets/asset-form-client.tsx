"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Archive, Edit3, Eye, Plus, Trash2, X } from "lucide-react";
import {
  archiveAssetAction,
  createAssetAction,
  softDeleteAssetAction,
  updateAssetAction,
  type AssetActionState,
} from "@/app/(dashboard)/dashboard/assets/actions";
import { FieldError, FormFeedback } from "@/components/master/master-form-feedback";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type AssetSelectOption = {
  id: string;
  label: string;
};

export type AssetFormOptions = {
  statuses: AssetSelectOption[];
  classes: AssetSelectOption[];
  categories: AssetSelectOption[];
  locations: AssetSelectOption[];
  units: AssetSelectOption[];
  departments: AssetSelectOption[];
  people: AssetSelectOption[];
  assetUsers: AssetSelectOption[];
  warranties: AssetSelectOption[];
  vendorContracts: AssetSelectOption[];
};

export type AssetRow = {
  id: string;
  code: string;
  name: string;
  serialNumber: string | null;
  description: string | null;
  assetStatusId: string | null;
  assetClassId: string | null;
  assetCategoryId: string | null;
  assetLocationId: string | null;
  unitId: string | null;
  departmentId: string | null;
  personInChargeId: string | null;
  assetUserId: string | null;
  warrantyId: string | null;
  vendorContractId: string | null;
  purchaseDate: string;
  cost: string;
  residualValue: string;
  usefulLifeMonths: string;
  depreciationMethod: string;
  capexOpex: string;
  metadata: string;
  qrPath: string | null;
  rfidTag: string | null;
  nfcTag: string | null;
  labelTemplate: string | null;
  isConsumable: boolean;
  quantity: number;
  availableQuantity: string;
  isPool: boolean;
  retentionUntil: string;
  archivedAt: string | null;
  deletedAt: string | null;
};

const initialState: AssetActionState = {};

function Section({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-4">
      <h3 className="border-b border-[var(--border)] pb-2 text-sm font-semibold text-[var(--text)]">{title}</h3>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function SelectField({
  defaultValue,
  error,
  label,
  name,
  options,
}: {
  defaultValue?: string | null;
  error?: string;
  label: string;
  name: string;
  options: AssetSelectOption[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
      <Select name={name} defaultValue={defaultValue ?? ""} className="mt-2">
        <option value="">Tidak dipilih</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
      <FieldError message={error} />
    </label>
  );
}

function CheckboxField({
  defaultChecked,
  label,
  name,
}: {
  defaultChecked?: boolean;
  label: string;
  name: string;
}) {
  return (
    <label className="flex h-11 items-center gap-3 rounded-md border border-[var(--border)] px-4 text-sm font-medium text-[var(--text)]">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}

function AssetFields({
  asset,
  options,
  state,
}: {
  asset?: AssetRow;
  options: AssetFormOptions;
  state: AssetActionState;
}) {
  return (
    <>
      <FormFeedback state={state} />
      {asset ? <input name="id" type="hidden" value={asset.id} /> : null}

      <Section title="Basic Information">
        {asset ? (
          <label className="block">
            <span className="text-sm font-medium text-[var(--text)]">Code</span>
            <Input value={asset.code} className="mt-2" disabled readOnly />
          </label>
        ) : null}
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Name</span>
          <Input name="name" defaultValue={asset?.name} placeholder="Nama aset" className="mt-2" required />
          <FieldError message={state.errors?.name} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Serial Number</span>
          <Input name="serialNumber" defaultValue={asset?.serialNumber ?? ""} placeholder="SN-001" className="mt-2" />
          <FieldError message={state.errors?.serialNumber} />
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[var(--text)]">Description</span>
          <Textarea name="description" defaultValue={asset?.description ?? ""} placeholder="Deskripsi aset" className="mt-2" />
          <FieldError message={state.errors?.description} />
        </label>
      </Section>

      <Section title="Classification">
        <SelectField name="assetStatusId" label="Status" options={options.statuses} defaultValue={asset?.assetStatusId} error={state.errors?.assetStatusId} />
        <SelectField name="assetClassId" label="Class" options={options.classes} defaultValue={asset?.assetClassId} error={state.errors?.assetClassId} />
        <SelectField name="assetCategoryId" label="Category" options={options.categories} defaultValue={asset?.assetCategoryId} error={state.errors?.assetCategoryId} />
        <SelectField name="unitId" label="Unit" options={options.units} defaultValue={asset?.unitId} error={state.errors?.unitId} />
      </Section>

      <Section title="Ownership & Location">
        <SelectField name="assetLocationId" label="Location" options={options.locations} defaultValue={asset?.assetLocationId} error={state.errors?.assetLocationId} />
        <SelectField name="departmentId" label="Department" options={options.departments} defaultValue={asset?.departmentId} error={state.errors?.departmentId} />
        <SelectField name="personInChargeId" label="Person In Charge" options={options.people} defaultValue={asset?.personInChargeId} error={state.errors?.personInChargeId} />
        <SelectField name="assetUserId" label="Asset User" options={options.assetUsers} defaultValue={asset?.assetUserId} error={state.errors?.assetUserId} />
      </Section>

      <Section title="Finance & Warranty">
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Purchase Date</span>
          <Input name="purchaseDate" type="date" defaultValue={asset?.purchaseDate ?? ""} className="mt-2" />
          <FieldError message={state.errors?.purchaseDate} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Cost</span>
          <Input name="cost" type="number" step="0.01" min="0" defaultValue={asset?.cost ?? ""} className="mt-2" />
          <FieldError message={state.errors?.cost} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Residual Value</span>
          <Input name="residualValue" type="number" step="0.01" min="0" defaultValue={asset?.residualValue ?? ""} className="mt-2" />
          <FieldError message={state.errors?.residualValue} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Useful Life Months</span>
          <Input name="usefulLifeMonths" type="number" min="1" step="1" defaultValue={asset?.usefulLifeMonths ?? ""} className="mt-2" />
          <FieldError message={state.errors?.usefulLifeMonths} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Depreciation Method</span>
          <Select name="depreciationMethod" defaultValue={asset?.depreciationMethod ?? "STRAIGHT_LINE"} className="mt-2">
            <option value="STRAIGHT_LINE">Straight Line</option>
            <option value="DECLINING_BALANCE">Declining Balance</option>
            <option value="UNITS_OF_ACTIVITY">Units Of Activity</option>
            <option value="NONE">None</option>
          </Select>
          <FieldError message={state.errors?.depreciationMethod} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Capex/Opex</span>
          <Select name="capexOpex" defaultValue={asset?.capexOpex ?? ""} className="mt-2">
            <option value="">Tidak dipilih</option>
            <option value="CAPEX">CAPEX</option>
            <option value="OPEX">OPEX</option>
          </Select>
          <FieldError message={state.errors?.capexOpex} />
        </label>
        <SelectField name="warrantyId" label="Warranty" options={options.warranties} defaultValue={asset?.warrantyId} error={state.errors?.warrantyId} />
        <SelectField name="vendorContractId" label="Vendor Contract" options={options.vendorContracts} defaultValue={asset?.vendorContractId} error={state.errors?.vendorContractId} />
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Retention Until</span>
          <Input name="retentionUntil" type="date" defaultValue={asset?.retentionUntil ?? ""} className="mt-2" />
          <FieldError message={state.errors?.retentionUntil} />
        </label>
      </Section>

      <Section title="Tracking & Inventory">
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">RFID Tag</span>
          <Input name="rfidTag" defaultValue={asset?.rfidTag ?? ""} placeholder="RFID tag" className="mt-2" />
          <FieldError message={state.errors?.rfidTag} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">NFC Tag</span>
          <Input name="nfcTag" defaultValue={asset?.nfcTag ?? ""} placeholder="NFC tag" className="mt-2" />
          <FieldError message={state.errors?.nfcTag} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">QR Path</span>
          <Input name="qrPath" defaultValue={asset?.qrPath ?? ""} placeholder="/qr/asset.png" className="mt-2" />
          <FieldError message={state.errors?.qrPath} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Label Template</span>
          <Input name="labelTemplate" defaultValue={asset?.labelTemplate ?? ""} placeholder="default" className="mt-2" />
          <FieldError message={state.errors?.labelTemplate} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Quantity</span>
          <Input name="quantity" type="number" min="1" step="1" defaultValue={asset?.quantity ?? 1} className="mt-2" />
          <FieldError message={state.errors?.quantity} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Available Quantity</span>
          <Input name="availableQuantity" type="number" min="0" step="1" defaultValue={asset?.availableQuantity ?? ""} className="mt-2" />
          <FieldError message={state.errors?.availableQuantity} />
        </label>
        <CheckboxField name="isConsumable" label="Consumable" defaultChecked={asset?.isConsumable} />
        <CheckboxField name="isPool" label="Pool Asset" defaultChecked={asset?.isPool} />
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-[var(--text)]">Metadata JSON</span>
          <Textarea name="metadata" defaultValue={asset?.metadata ?? ""} placeholder='{"key":"value"}' className="mt-2 font-mono" />
          <FieldError message={state.errors?.metadata} />
        </label>
      </Section>
    </>
  );
}

function AssetFormDialog({
  asset,
  onClose,
  options,
  pending,
  state,
  title,
  action,
}: {
  asset?: AssetRow;
  onClose: () => void;
  options: AssetFormOptions;
  pending: boolean;
  state: AssetActionState;
  title: string;
  action: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-6">
      <form action={action} className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-lg border border-[var(--border)] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Code dan QR token dikelola otomatis oleh sistem.</p>
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
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <AssetFields asset={asset} options={options} state={state} />
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
          <Button variant="secondary" onClick={onClose}>Batal</Button>
          <Button type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan"}</Button>
        </div>
      </form>
    </div>
  );
}

export function AssetCreateAction({ canManage, options }: { canManage: boolean; options: AssetFormOptions }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createAssetAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  if (!canManage) {
    return null;
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Aset
      </Button>
      {open ? (
        <AssetFormDialog action={action} onClose={() => setOpen(false)} options={options} pending={pending} state={state} title="Tambah Aset" />
      ) : null}
    </>
  );
}

function AssetEditButton({ asset, options }: { asset: AssetRow; options: AssetFormOptions }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateAssetAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Edit3 className="h-4 w-4" />
        Edit
      </Button>
      {open ? (
        <AssetFormDialog action={action} asset={asset} onClose={() => setOpen(false)} options={options} pending={pending} state={state} title="Edit Aset" />
      ) : null}
    </>
  );
}

function AssetConfirmButton({
  action,
  asset,
  description,
  icon,
  title,
  variant,
}: {
  action: typeof archiveAssetAction | typeof softDeleteAssetAction;
  asset: AssetRow;
  description: string;
  icon: ReactNode;
  title: string;
  variant: "warning" | "danger";
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button variant={variant} size="sm" onClick={() => setOpen(true)}>
        {icon}
        {variant === "warning" ? "Archive" : "Delete"}
      </Button>
      {open ? (
        <form action={formAction}>
          <ConfirmDialog title={title} description={description} confirmLabel={variant === "warning" ? "Archive" : "Hapus"} pending={pending} onCancel={() => setOpen(false)}>
            <input name="id" type="hidden" value={asset.id} />
            <FormFeedback state={state} />
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

export function AssetRowActions({
  asset,
  canManage,
  options,
}: {
  asset: AssetRow;
  canManage: boolean;
  options: AssetFormOptions;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/dashboard/assets/${asset.id}`}
        className="inline-flex h-8 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-medium text-[var(--text)] transition hover:bg-slate-50"
      >
        <Eye className="h-4 w-4" />
        Detail
      </Link>
      {canManage ? (
        <>
          <AssetEditButton asset={asset} options={options} />
          <AssetConfirmButton
            action={archiveAssetAction}
            asset={asset}
            description={`Asset "${asset.name}" akan ditandai sebagai arsip.`}
            icon={<Archive className="h-4 w-4" />}
            title="Archive Asset"
            variant="warning"
          />
          <AssetConfirmButton
            action={softDeleteAssetAction}
            asset={asset}
            description={`Asset "${asset.name}" akan dihapus secara soft delete.`}
            icon={<Trash2 className="h-4 w-4" />}
            title="Soft Delete Asset"
            variant="danger"
          />
        </>
      ) : null}
    </div>
  );
}
