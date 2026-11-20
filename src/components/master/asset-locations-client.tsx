"use client";

import { useEffect, useState } from "react";
import { CornerDownRight, Edit3, Plus, Trash2 } from "lucide-react";
import {
  createAssetLocationAction,
  deleteAssetLocationAction,
  updateAssetLocationAction,
  type AssetLocationActionState,
} from "@/app/(dashboard)/dashboard/master/asset-location-actions";
import { FieldError, FormFeedback } from "@/components/master/master-form-feedback";
import { MasterRecordForm } from "@/components/master/master-record-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TEXT_LIMITS } from "@/lib/text-limits";
import { isChildCodeOf, nextChildCode } from "@/lib/location-tree";
import { useFormAction } from "@/components/ui/use-form-action";

export type AssetLocationOption = {
  id: string;
  code: string;
  name: string;
  /** Full path, e.g. "Gudang Pusat › Lantai 2". */
  path: string;
  depth: number;
  /** This location plus all of its descendants. */
  subtreeIds: string[];
};

export type AssetLocationRow = {
  id: string;
  code: string;
  name: string;
  depth: number;
  path: string;
  parentId: string | null;
  parentName: string | null;
  description: string | null;
  createdAt: string;
  assetCount: number;
  childCount: number;
};

const initialState: AssetLocationActionState = {};

function AssetLocationFields({
  location,
  defaultParentId,
  parentOptions,
  state,
}: {
  location?: AssetLocationRow;
  defaultParentId?: string;
  parentOptions: AssetLocationOption[];
  state: AssetLocationActionState;
}) {
  // A location cannot sit under itself or under one of its own sub-locations.
  const blocked = new Set(location ? parentOptions.find((option) => option.id === location.id)?.subtreeIds ?? [location.id] : []);
  const availableParents = parentOptions.filter((parent) => !blocked.has(parent.id));
  const [parentId, setParentId] = useState(location?.parentId ?? defaultParentId ?? "");
  const parent = parentOptions.find((option) => option.id === parentId);
  // Mirrors the server: a sub-location keeps its number while it already follows the parent's code.
  const autoCode = parent
    ? location && isChildCodeOf(location.code, parent.code)
      ? location.code
      : nextChildCode(parent.code, parentOptions.map((option) => option.code))
    : null;

  return (
    <>
      <FormFeedback state={state} />
      {location ? <input name="id" type="hidden" value={location.id} /> : null}
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Parent Location</span>
        <Select name="parentId" value={parentId} onChange={(event) => setParentId(event.target.value)} className="mt-2">
          <option value="">Tidak ada (jadikan Parent Location)</option>
          {availableParents.map((option) => (
            <option key={option.id} value={option.id}>
              {option.code} - {option.path}
            </option>
          ))}
        </Select>
        <span className="mt-1 block text-xs text-[var(--muted)]">
          {parent
            ? `Lokasi ini menjadi sub-lokasi dari: ${parent.code} - ${parent.path}`
            : "Tanpa parent, lokasi ini menjadi Parent Location (misalnya gedung atau site)."}
        </span>
        <FieldError message={state.errors?.parentId} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Code</span>
        {autoCode ? (
          <>
            <Input value={autoCode} className="mt-2" disabled readOnly />
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Otomatis mengikuti code parent ({parent?.code}-01, {parent?.code}-02, dst).
            </span>
          </>
        ) : (
          <>
            <Input
              name="code"
              placeholder="GDA"
              defaultValue={location?.code}
              className="mt-2 uppercase"
              maxLength={TEXT_LIMITS.code}
              required
            />
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Isi code singkat, misalnya GDA untuk Gedung A. Sub-lokasinya akan otomatis menjadi GDA-01, GDA-02, dst.
              {location && location.childCount > 0 ? " Jika code diubah, code semua sub-lokasinya ikut menyesuaikan." : ""}
            </span>
          </>
        )}
        <FieldError message={state.errors?.code} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Name</span>
        <Input name="name" placeholder="Gedung A" defaultValue={location?.name} className="mt-2" maxLength={TEXT_LIMITS.name} required />
        <FieldError message={state.errors?.name} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Description</span>
        <Textarea
          name="description"
          placeholder="Deskripsi singkat lokasi aset"
          defaultValue={location?.description ?? ""}
          className="mt-2"
          maxLength={TEXT_LIMITS.description}
        />
        <FieldError message={state.errors?.description} />
      </label>
    </>
  );
}

function CreateAssetLocationButton({
  parentOptions,
  parent,
}: {
  parentOptions: AssetLocationOption[];
  /** When set, the button adds a sub-location under this row. */
  parent?: AssetLocationRow;
}) {
  const [open, setOpen] = useState(false);
  const [state, form, pending] = useFormAction(createAssetLocationAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      {parent ? (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} title={`Tambah sub-lokasi di bawah ${parent.name}`}>
          <CornerDownRight className="h-4 w-4" />
          Sub-lokasi
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Tambah Lokasi
        </Button>
      )}
      {open ? (
        <form {...form}>
          <MasterRecordForm
            title={parent ? "Tambah Sub-lokasi" : "Tambah Lokasi Aset"}
            description={
              parent
                ? `Sub-lokasi baru akan dibuat di bawah ${parent.path}.`
                : "Kosongkan parent untuk membuat Parent Location dengan code sendiri, atau pilih parent untuk membuat sub-lokasi."
            }
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <AssetLocationFields defaultParentId={parent?.id} parentOptions={parentOptions} state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function EditAssetLocationButton({
  location,
  parentOptions,
}: {
  location: AssetLocationRow;
  parentOptions: AssetLocationOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, form, pending] = useFormAction(updateAssetLocationAction, initialState);

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
        <form {...form}>
          <MasterRecordForm
            title="Edit Lokasi Aset"
            description="Perbarui code, nama, parent, atau deskripsi lokasi. Code sub-lokasi selalu mengikuti code parent-nya."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <AssetLocationFields location={location} parentOptions={parentOptions} state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function DeleteAssetLocationButton({ location }: { location: AssetLocationRow }) {
  const [open, setOpen] = useState(false);
  const [state, form, pending] = useFormAction(deleteAssetLocationAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Hapus
      </Button>
      {open ? (
        <form {...form}>
          <ConfirmDialog
            title="Hapus Lokasi Aset"
            description={`Lokasi "${location.name}" akan dihapus jika belum dipakai asset dan tidak punya child location.`}
            confirmLabel="Hapus"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="id" type="hidden" value={location.id} />
            <FormFeedback state={state} />
            {location.assetCount > 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Saat ini lokasi ini dipakai oleh {location.assetCount} aset, sehingga delete akan ditolak.
              </p>
            ) : null}
            {location.childCount > 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Saat ini lokasi ini memiliki {location.childCount} child location, sehingga delete akan ditolak.
              </p>
            ) : null}
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

export function AssetLocationCreateAction({
  canManage,
  parentOptions,
}: {
  canManage: boolean;
  parentOptions: AssetLocationOption[];
}) {
  if (!canManage) {
    return null;
  }

  return <CreateAssetLocationButton parentOptions={parentOptions} />;
}

export function AssetLocationRowActions({
  canManage,
  location,
  parentOptions,
}: {
  canManage: boolean;
  location: AssetLocationRow;
  parentOptions: AssetLocationOption[];
}) {
  if (!canManage) {
    return <span className="text-xs text-[var(--muted)]">View only</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <CreateAssetLocationButton parent={location} parentOptions={parentOptions} />
      <EditAssetLocationButton location={location} parentOptions={parentOptions} />
      <DeleteAssetLocationButton location={location} />
    </div>
  );
}
