"use client";

import { useActionState, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
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

export type AssetLocationOption = {
  id: string;
  code: string;
  name: string;
};

export type AssetLocationRow = {
  id: string;
  code: string;
  name: string;
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
  parentOptions,
  state,
}: {
  location?: AssetLocationRow;
  parentOptions: AssetLocationOption[];
  state: AssetLocationActionState;
}) {
  const availableParents = location
    ? parentOptions.filter((parent) => parent.id !== location.id)
    : parentOptions;

  return (
    <>
      <FormFeedback state={state} />
      {location ? <input name="id" type="hidden" value={location.id} /> : null}
      {location ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--text)]">Code</span>
          <Input value={location.code} className="mt-2 uppercase" disabled readOnly />
        </label>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Name</span>
        <Input name="name" placeholder="Warehouse Utama" defaultValue={location?.name} className="mt-2" required />
        <FieldError message={state.errors?.name} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Parent Location</span>
        <Select name="parentId" defaultValue={location?.parentId ?? ""} className="mt-2">
          <option value="">Tidak ada parent</option>
          {availableParents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.code} - {parent.name}
            </option>
          ))}
        </Select>
        <FieldError message={state.errors?.parentId} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Description</span>
        <Textarea
          name="description"
          placeholder="Deskripsi singkat lokasi aset"
          defaultValue={location?.description ?? ""}
          className="mt-2"
        />
        <FieldError message={state.errors?.description} />
      </label>
    </>
  );
}

function CreateAssetLocationButton({ parentOptions }: { parentOptions: AssetLocationOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createAssetLocationAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Lokasi
      </Button>
      {open ? (
        <form action={action}>
          <MasterRecordForm
            title="Tambah Lokasi Aset"
            description="Buat lokasi aset baru dan hubungkan ke parent jika diperlukan."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <AssetLocationFields parentOptions={parentOptions} state={state} />
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
  const [state, action, pending] = useActionState(updateAssetLocationAction, initialState);

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
        <form action={action}>
          <MasterRecordForm
            title="Edit Lokasi Aset"
            description="Perbarui nama, parent, atau deskripsi lokasi."
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
  const [state, action, pending] = useActionState(deleteAssetLocationAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      {open ? (
        <form action={action}>
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
      <EditAssetLocationButton location={location} parentOptions={parentOptions} />
      <DeleteAssetLocationButton location={location} />
    </div>
  );
}
