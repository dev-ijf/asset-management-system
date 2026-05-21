"use client";

import { useActionState, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import {
  createAssetStatusAction,
  deleteAssetStatusAction,
  updateAssetStatusAction,
  type AssetStatusActionState,
} from "@/app/(dashboard)/dashboard/master/asset-status-actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MasterRecordForm } from "@/components/master/master-record-form";
import { FieldError, FormFeedback } from "@/components/master/master-form-feedback";

export type AssetStatusRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  assetCount: number;
};

const initialState: AssetStatusActionState = {};

function AssetStatusFields({
  state,
  status,
}: {
  state: AssetStatusActionState;
  status?: AssetStatusRow;
}) {
  return (
    <>
      <FormFeedback state={state} />
      {status ? <input name="id" type="hidden" value={status.id} /> : null}
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Code</span>
        <Input
          name="code"
          placeholder="ACTIVE"
          defaultValue={status?.code}
          className="mt-2 uppercase"
          required
        />
        <FieldError message={state.errors?.code} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Name</span>
        <Input name="name" placeholder="Aktif" defaultValue={status?.name} className="mt-2" required />
        <FieldError message={state.errors?.name} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Description</span>
        <Textarea
          name="description"
          placeholder="Deskripsi singkat status aset"
          defaultValue={status?.description ?? ""}
          className="mt-2"
        />
        <FieldError message={state.errors?.description} />
      </label>
    </>
  );
}

function CreateAssetStatusButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createAssetStatusAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Status
      </Button>
      {open ? (
        <form action={action}>
          <MasterRecordForm
            title="Tambah Status Aset"
            description="Buat status siklus hidup aset baru."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <AssetStatusFields state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function EditAssetStatusButton({ status }: { status: AssetStatusRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateAssetStatusAction, initialState);

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
            title="Edit Status Aset"
            description="Perbarui code, nama, atau deskripsi status."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <AssetStatusFields state={state} status={status} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function DeleteAssetStatusButton({ status }: { status: AssetStatusRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAssetStatusAction, initialState);

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
            title="Hapus Status Aset"
            description={`Status "${status.name}" akan dihapus jika belum dipakai asset.`}
            confirmLabel="Hapus"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="id" type="hidden" value={status.id} />
            <FormFeedback state={state} />
            {status.assetCount > 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Saat ini status ini dipakai oleh {status.assetCount} aset, sehingga delete akan ditolak.
              </p>
            ) : null}
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

export function AssetStatusCreateAction({ canManage }: { canManage: boolean }) {
  if (!canManage) {
    return null;
  }

  return <CreateAssetStatusButton />;
}

export function AssetStatusRowActions({
  status,
  canManage,
}: {
  status: AssetStatusRow;
  canManage: boolean;
}) {
  if (!canManage) {
    return <span className="text-xs text-[var(--muted)]">View only</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <EditAssetStatusButton status={status} />
      <DeleteAssetStatusButton status={status} />
    </div>
  );
}
