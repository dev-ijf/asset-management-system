"use client";

import { useActionState, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { FieldError, FormFeedback } from "@/components/master/master-form-feedback";
import { MasterRecordForm } from "@/components/master/master-record-form";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type MasterActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

export type MasterFieldOption = {
  label: string;
  value: string;
};

export type MasterField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: MasterFieldOption[];
};

export type MasterCrudRecord = {
  id: string;
  values: Record<string, string | number | null | undefined>;
  assetCount: number;
};

type MasterAction = (previousState: MasterActionState, formData: FormData) => Promise<MasterActionState>;

const initialState: MasterActionState = {};

function MasterFields({
  fields,
  record,
  state,
}: {
  fields: MasterField[];
  record?: MasterCrudRecord;
  state: MasterActionState;
}) {
  return (
    <>
      <FormFeedback state={state} />
      {record ? <input name="id" type="hidden" value={record.id} /> : null}
      {fields.map((field) => {
        const defaultValue = record?.values[field.name] ?? "";

        if (field.type === "textarea") {
          return (
            <label key={field.name} className="block">
              <span className="text-sm font-medium text-[var(--text)]">{field.label}</span>
              <Textarea
                name={field.name}
                placeholder={field.placeholder}
                defaultValue={String(defaultValue)}
                className="mt-2"
                required={field.required}
              />
              <FieldError message={state.errors?.[field.name]} />
            </label>
          );
        }

        if (field.type === "select") {
          return (
            <label key={field.name} className="block">
              <span className="text-sm font-medium text-[var(--text)]">{field.label}</span>
              <Select name={field.name} defaultValue={String(defaultValue)} className="mt-2" required={field.required}>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <FieldError message={state.errors?.[field.name]} />
            </label>
          );
        }

        return (
          <label key={field.name} className="block">
            <span className="text-sm font-medium text-[var(--text)]">{field.label}</span>
            <Input
              name={field.name}
              type={field.type ?? "text"}
              placeholder={field.placeholder}
              defaultValue={String(defaultValue)}
              className="mt-2"
              required={field.required}
            />
            <FieldError message={state.errors?.[field.name]} />
          </label>
        );
      })}
    </>
  );
}

function CreateMasterButton({
  action,
  buttonLabel,
  description,
  fields,
  title,
}: {
  action: MasterAction;
  buttonLabel: string;
  description: string;
  fields: MasterField[];
  title: string;
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
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {buttonLabel}
      </Button>
      {open ? (
        <form action={formAction}>
          <MasterRecordForm
            title={title}
            description={description}
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <MasterFields fields={fields} state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function EditMasterButton({
  action,
  description,
  fields,
  record,
  title,
}: {
  action: MasterAction;
  description: string;
  fields: MasterField[];
  record: MasterCrudRecord;
  title: string;
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
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Edit3 className="h-4 w-4" />
        Edit
      </Button>
      {open ? (
        <form action={formAction}>
          <MasterRecordForm
            title={title}
            description={description}
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <MasterFields fields={fields} record={record} state={state} />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function DeleteMasterButton({
  action,
  deleteDescription,
  deleteTitle,
  record,
}: {
  action: MasterAction;
  deleteDescription: string;
  deleteTitle: string;
  record: MasterCrudRecord;
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
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      {open ? (
        <form action={formAction}>
          <ConfirmDialog
            title={deleteTitle}
            description={deleteDescription}
            confirmLabel="Hapus"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="id" type="hidden" value={record.id} />
            <FormFeedback state={state} />
            {record.assetCount > 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Saat ini data ini dipakai oleh {record.assetCount} aset, sehingga delete akan ditolak.
              </p>
            ) : null}
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

export function MasterCreateAction({
  action,
  buttonLabel,
  canManage,
  description,
  fields,
  title,
}: {
  action: MasterAction;
  buttonLabel: string;
  canManage: boolean;
  description: string;
  fields: MasterField[];
  title: string;
}) {
  if (!canManage) {
    return null;
  }

  return (
    <CreateMasterButton
      action={action}
      buttonLabel={buttonLabel}
      description={description}
      fields={fields}
      title={title}
    />
  );
}

export function MasterRowActions({
  canManage,
  deleteAction,
  deleteDescription,
  deleteTitle,
  editDescription,
  editFields,
  editTitle,
  record,
  updateAction,
}: {
  canManage: boolean;
  deleteAction: MasterAction;
  deleteDescription: string;
  deleteTitle: string;
  editDescription: string;
  editFields: MasterField[];
  editTitle: string;
  record: MasterCrudRecord;
  updateAction: MasterAction;
}) {
  if (!canManage) {
    return <span className="text-xs text-[var(--muted)]">View only</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <EditMasterButton action={updateAction} description={editDescription} fields={editFields} record={record} title={editTitle} />
      <DeleteMasterButton action={deleteAction} deleteDescription={deleteDescription} deleteTitle={deleteTitle} record={record} />
    </div>
  );
}
