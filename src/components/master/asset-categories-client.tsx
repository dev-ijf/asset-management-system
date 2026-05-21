"use client";

import { useActionState, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import {
  createAssetCategoryAction,
  deleteAssetCategoryAction,
  updateAssetCategoryAction,
  type AssetCategoryActionState,
} from "@/app/(dashboard)/dashboard/master/asset-category-actions";
import { FieldError, FormFeedback } from "@/components/master/master-form-feedback";
import { MasterRecordForm } from "@/components/master/master-record-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type AssetCategoryOption = {
  id: string;
  code: string;
  name: string;
};

export type AssetCategoryRow = {
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

const initialState: AssetCategoryActionState = {};

function AssetCategoryFields({
  category,
  parentOptions,
  state,
}: {
  category?: AssetCategoryRow;
  parentOptions: AssetCategoryOption[];
  state: AssetCategoryActionState;
}) {
  const availableParents = category
    ? parentOptions.filter((parent) => parent.id !== category.id)
    : parentOptions;

  return (
    <>
      <FormFeedback state={state} />
      {category ? <input name="id" type="hidden" value={category.id} /> : null}
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Code</span>
        <Input
          name="code"
          placeholder="IT-EQUIP"
          defaultValue={category?.code}
          className="mt-2 uppercase"
          required
        />
        <FieldError message={state.errors?.code} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Name</span>
        <Input name="name" placeholder="Peralatan IT" defaultValue={category?.name} className="mt-2" required />
        <FieldError message={state.errors?.name} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Parent Category</span>
        <Select name="parentId" defaultValue={category?.parentId ?? ""} className="mt-2">
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
          placeholder="Deskripsi singkat kategori aset"
          defaultValue={category?.description ?? ""}
          className="mt-2"
        />
        <FieldError message={state.errors?.description} />
      </label>
    </>
  );
}

function CreateAssetCategoryButton({ parentOptions }: { parentOptions: AssetCategoryOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createAssetCategoryAction, initialState);

  useEffect(() => {
    if (state.ok) {
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Kategori
      </Button>
      {open ? (
        <form action={action}>
          <MasterRecordForm
            title="Tambah Kategori Aset"
            description="Buat kategori aset baru dan hubungkan ke parent jika diperlukan."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <AssetCategoryFields parentOptions={parentOptions} state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function EditAssetCategoryButton({
  category,
  parentOptions,
}: {
  category: AssetCategoryRow;
  parentOptions: AssetCategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateAssetCategoryAction, initialState);

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
            title="Edit Kategori Aset"
            description="Perbarui code, nama, parent, atau deskripsi kategori."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <AssetCategoryFields category={category} parentOptions={parentOptions} state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function DeleteAssetCategoryButton({ category }: { category: AssetCategoryRow }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAssetCategoryAction, initialState);

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
            title="Hapus Kategori Aset"
            description={`Kategori "${category.name}" akan dihapus jika belum dipakai asset dan tidak punya child category.`}
            confirmLabel="Hapus"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="id" type="hidden" value={category.id} />
            <FormFeedback state={state} />
            {category.assetCount > 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Saat ini kategori ini dipakai oleh {category.assetCount} aset, sehingga delete akan ditolak.
              </p>
            ) : null}
            {category.childCount > 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Saat ini kategori ini memiliki {category.childCount} child category, sehingga delete akan ditolak.
              </p>
            ) : null}
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

export function AssetCategoryCreateAction({
  canManage,
  parentOptions,
}: {
  canManage: boolean;
  parentOptions: AssetCategoryOption[];
}) {
  if (!canManage) {
    return null;
  }

  return <CreateAssetCategoryButton parentOptions={parentOptions} />;
}

export function AssetCategoryRowActions({
  canManage,
  category,
  parentOptions,
}: {
  canManage: boolean;
  category: AssetCategoryRow;
  parentOptions: AssetCategoryOption[];
}) {
  if (!canManage) {
    return <span className="text-xs text-[var(--muted)]">View only</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <EditAssetCategoryButton category={category} parentOptions={parentOptions} />
      <DeleteAssetCategoryButton category={category} />
    </div>
  );
}
