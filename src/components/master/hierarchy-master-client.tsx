"use client";

import { useEffect, useState } from "react";
import { CornerDownRight, Edit3, Plus, Trash2 } from "lucide-react";
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

/**
 * Create/edit/delete for two-level-or-deeper masters (locations, departments): a top-level record
 * ("Parent …") has a typed code, each child gets "<parent code>-NN" (see lib/hierarchy-codes).
 */
export type HierarchyActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

type HierarchyAction = (state: HierarchyActionState, formData: FormData) => Promise<HierarchyActionState>;

export type HierarchyActions = {
  create: HierarchyAction;
  update: HierarchyAction;
  remove: HierarchyAction;
};

export type HierarchyOption = {
  id: string;
  code: string;
  name: string;
  /** Full path, e.g. "Sekolah › Teacher". */
  path: string;
  depth: number;
  /** This record plus all of its descendants. */
  subtreeIds: string[];
};

export type HierarchyRow = {
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

export type HierarchyKind = "location" | "department";

const TEXTS = {
  location: {
    entity: "Lokasi",
    entityLower: "lokasi",
    parentLabel: "Parent Location",
    childLower: "sub-lokasi",
    childButton: "Sub-lokasi",
    addButton: "Tambah Lokasi",
    addTitle: "Tambah Lokasi Aset",
    editTitle: "Edit Lokasi Aset",
    deleteTitle: "Hapus Lokasi Aset",
    parentExample: "misalnya gedung atau site",
    codeExample: "GDA",
    codeExampleMeaning: "Gedung A",
    namePlaceholder: "Gedung A",
    descriptionPlaceholder: "Deskripsi singkat lokasi aset",
  },
  department: {
    entity: "Departemen",
    entityLower: "departemen",
    parentLabel: "Parent Department",
    childLower: "sub-departemen",
    childButton: "Sub-departemen",
    addButton: "Tambah Departemen",
    addTitle: "Tambah Departemen",
    editTitle: "Edit Departemen",
    deleteTitle: "Hapus Departemen",
    parentExample: "misalnya Sekolah atau Yayasan",
    codeExample: "SKL",
    codeExampleMeaning: "Sekolah",
    namePlaceholder: "Sekolah",
    descriptionPlaceholder: "Deskripsi singkat departemen",
  },
} as const;

const initialState: HierarchyActionState = {};

function HierarchyFields({
  kind,
  record,
  defaultParentId,
  options,
  state,
}: {
  kind: HierarchyKind;
  record?: HierarchyRow;
  defaultParentId?: string;
  options: HierarchyOption[];
  state: HierarchyActionState;
}) {
  const t = TEXTS[kind];
  // A record cannot sit under itself or under one of its own children.
  const blocked = new Set(record ? options.find((option) => option.id === record.id)?.subtreeIds ?? [record.id] : []);
  const availableParents = options.filter((parent) => !blocked.has(parent.id));
  const [parentId, setParentId] = useState(record?.parentId ?? defaultParentId ?? "");
  const parent = options.find((option) => option.id === parentId);
  // Mirrors the server: a child keeps its number while it already follows the parent's code.
  const autoCode = parent
    ? record && isChildCodeOf(record.code, parent.code)
      ? record.code
      : nextChildCode(parent.code, options.map((option) => option.code))
    : null;

  return (
    <>
      <FormFeedback state={state} />
      {record ? <input name="id" type="hidden" value={record.id} /> : null}
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">{t.parentLabel}</span>
        <Select name="parentId" value={parentId} onChange={(event) => setParentId(event.target.value)} className="mt-2">
          <option value="">Tidak ada (jadikan {t.parentLabel})</option>
          {availableParents.map((option) => (
            <option key={option.id} value={option.id}>
              {option.code} - {option.path}
            </option>
          ))}
        </Select>
        <span className="mt-1 block text-xs text-[var(--muted)]">
          {parent
            ? `${t.entity} ini menjadi ${t.childLower} dari: ${parent.code} - ${parent.path}`
            : `Tanpa parent, ${t.entityLower} ini menjadi ${t.parentLabel} (${t.parentExample}).`}
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
              placeholder={t.codeExample}
              defaultValue={record?.code}
              className="mt-2 uppercase"
              maxLength={TEXT_LIMITS.code}
              required
            />
            <span className="mt-1 block text-xs text-[var(--muted)]">
              Isi code singkat, misalnya {t.codeExample} untuk {t.codeExampleMeaning}. Code {t.childLower}-nya akan otomatis
              menjadi {t.codeExample}-01, {t.codeExample}-02, dst.
              {record && record.childCount > 0 ? ` Jika code diubah, code semua ${t.childLower}-nya ikut menyesuaikan.` : ""}
            </span>
          </>
        )}
        <FieldError message={state.errors?.code} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Name</span>
        <Input name="name" placeholder={t.namePlaceholder} defaultValue={record?.name} className="mt-2" maxLength={TEXT_LIMITS.name} required />
        <FieldError message={state.errors?.name} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-[var(--text)]">Description</span>
        <Textarea
          name="description"
          placeholder={t.descriptionPlaceholder}
          defaultValue={record?.description ?? ""}
          className="mt-2"
          maxLength={TEXT_LIMITS.description}
        />
        <FieldError message={state.errors?.description} />
      </label>
    </>
  );
}

/** Closes the dialog when a save succeeds (only on the change, so reopening works). */
function useCloseOnSuccess(ok: boolean | undefined, close: () => void) {
  useEffect(() => {
    if (ok) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok]);
}

function CreateButton({
  kind,
  action,
  options,
  parent,
}: {
  kind: HierarchyKind;
  action: HierarchyAction;
  options: HierarchyOption[];
  /** When set, the button adds a child under this row. */
  parent?: HierarchyRow;
}) {
  const t = TEXTS[kind];
  const [open, setOpen] = useState(false);
  const [state, form, pending] = useFormAction(action, initialState);
  useCloseOnSuccess(state.ok, () => setOpen(false));

  return (
    <>
      {parent ? (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)} title={`Tambah ${t.childLower} di bawah ${parent.name}`}>
          <CornerDownRight className="h-4 w-4" />
          {t.childButton}
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {t.addButton}
        </Button>
      )}
      {open ? (
        <form {...form}>
          <MasterRecordForm
            title={parent ? `Tambah ${t.childButton}` : t.addTitle}
            description={
              parent
                ? `${t.childButton} baru akan dibuat di bawah ${parent.path}.`
                : `Kosongkan parent untuk membuat ${t.parentLabel} dengan code sendiri, atau pilih parent untuk membuat ${t.childLower}.`
            }
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <HierarchyFields kind={kind} defaultParentId={parent?.id} options={options} state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function EditButton({
  kind,
  action,
  record,
  options,
}: {
  kind: HierarchyKind;
  action: HierarchyAction;
  record: HierarchyRow;
  options: HierarchyOption[];
}) {
  const t = TEXTS[kind];
  const [open, setOpen] = useState(false);
  const [state, form, pending] = useFormAction(action, initialState);
  useCloseOnSuccess(state.ok, () => setOpen(false));

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Edit3 className="h-4 w-4" />
        Edit
      </Button>
      {open ? (
        <form {...form}>
          <MasterRecordForm
            title={t.editTitle}
            description={`Perbarui code, nama, parent, atau deskripsi. Code ${t.childLower} selalu mengikuti code parent-nya.`}
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <HierarchyFields kind={kind} record={record} options={options} state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function DeleteButton({ kind, action, record }: { kind: HierarchyKind; action: HierarchyAction; record: HierarchyRow }) {
  const t = TEXTS[kind];
  const [open, setOpen] = useState(false);
  const [state, form, pending] = useFormAction(action, initialState);
  useCloseOnSuccess(state.ok, () => setOpen(false));

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Hapus
      </Button>
      {open ? (
        <form {...form}>
          <ConfirmDialog
            title={t.deleteTitle}
            description={`${t.entity} "${record.name}" akan dihapus jika belum dipakai asset dan tidak punya ${t.childLower}.`}
            confirmLabel="Hapus"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="id" type="hidden" value={record.id} />
            <FormFeedback state={state} />
            {record.assetCount > 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Saat ini {t.entityLower} ini dipakai oleh {record.assetCount} aset, sehingga delete akan ditolak.
              </p>
            ) : null}
            {record.childCount > 0 ? (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Saat ini {t.entityLower} ini memiliki {record.childCount} {t.childLower}, sehingga delete akan ditolak.
              </p>
            ) : null}
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

export function HierarchyCreateAction({
  kind,
  actions,
  canManage,
  options,
}: {
  kind: HierarchyKind;
  actions: HierarchyActions;
  canManage: boolean;
  options: HierarchyOption[];
}) {
  if (!canManage) return null;
  return <CreateButton kind={kind} action={actions.create} options={options} />;
}

export function HierarchyRowActions({
  kind,
  actions,
  canManage,
  record,
  options,
}: {
  kind: HierarchyKind;
  actions: HierarchyActions;
  canManage: boolean;
  record: HierarchyRow;
  options: HierarchyOption[];
}) {
  if (!canManage) {
    return <span className="text-xs text-[var(--muted)]">View only</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <CreateButton kind={kind} action={actions.create} options={options} parent={record} />
      <EditButton kind={kind} action={actions.update} record={record} options={options} />
      <DeleteButton kind={kind} action={actions.remove} record={record} />
    </div>
  );
}
