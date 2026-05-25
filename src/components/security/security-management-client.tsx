"use client";

import { useActionState, useEffect, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import {
  createPermissionAction,
  createRoleAction,
  createUserAction,
  deletePermissionAction,
  deleteRoleAction,
  deleteUserAction,
  type SecurityActionState,
  updatePermissionAction,
  updateRoleAction,
  updateUserAction,
} from "@/app/(dashboard)/dashboard/security/actions";
import { FieldError } from "@/components/master/master-form-feedback";
import { MasterRecordForm } from "@/components/master/master-record-form";
import { DataTable } from "@/components/tables/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";

type SecurityAction = (previousState: SecurityActionState, formData: FormData) => Promise<SecurityActionState>;

export type SecurityOption = {
  id: string;
  name: string;
};

export type UserSecurityRecord = {
  id: string;
  name: string;
  email: string;
  roleIds: string[];
  permissionIds: string[];
  roles: string[];
  directPermissions: string[];
  createdAt: string;
};

export type RoleSecurityRecord = {
  id: string;
  name: string;
  guardName: string;
  permissionIds: string[];
  permissions: string[];
  userCount: number;
  createdAt: string;
};

export type PermissionSecurityRecord = {
  id: string;
  name: string;
  guardName: string;
  roleCount: number;
  userCount: number;
  createdAt: string;
};

const initialState: SecurityActionState = {};

function Feedback({ state }: { state: SecurityActionState }) {
  if (!state.message) return null;

  return (
    <div
      className={
        state.ok
          ? "rounded-md border border-[rgba(34,197,94,0.35)] bg-[#e7f9ef] px-4 py-3 text-sm font-medium text-[#13a251]"
          : "rounded-md border border-[rgba(255,91,82,0.35)] bg-[#ffecea] px-4 py-3 text-sm font-medium text-[var(--danger)]"
      }
    >
      {state.message}
    </div>
  );
}

function BadgeList({ empty = "-", labels, variant = "primary" }: { empty?: string; labels: string[]; variant?: "primary" | "info" | "warning" }) {
  if (labels.length === 0) return <span className="text-[var(--muted)]">{empty}</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <Badge key={label} variant={variant}>
          {label}
        </Badge>
      ))}
    </div>
  );
}

function CheckboxGroup({
  error,
  name,
  options,
  selectedIds,
  title,
}: {
  error?: string;
  name: string;
  options: SecurityOption[];
  selectedIds: string[];
  title: string;
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--text)]">{title}</p>
      <div className="mt-2 max-h-44 space-y-2 overflow-auto rounded-md border border-[var(--border)] bg-white p-3">
        {options.length > 0 ? (
          options.map((option) => (
            <label key={option.id} className="flex items-center gap-2 text-sm text-[var(--text)]">
              <input
                className="h-4 w-4 rounded border-[var(--border)]"
                defaultChecked={selectedIds.includes(option.id)}
                name={name}
                type="checkbox"
                value={option.id}
              />
              {option.name}
            </label>
          ))
        ) : (
          <p className="text-sm text-[var(--muted)]">Belum ada data pilihan.</p>
        )}
      </div>
      <FieldError message={error} />
    </div>
  );
}

function DeleteButton({
  action,
  description,
  id,
  title,
}: {
  action: SecurityAction;
  description: string;
  id: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
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
            title={title}
            description={description}
            confirmLabel="Hapus"
            pending={pending}
            onCancel={() => setOpen(false)}
          >
            <input name="id" type="hidden" value={id} />
            <Feedback state={state} />
          </ConfirmDialog>
        </form>
      ) : null}
    </>
  );
}

function UserForm({
  action,
  mode,
  permissions,
  record,
  roles,
}: {
  action: SecurityAction;
  mode: "create" | "edit";
  permissions: SecurityOption[];
  record?: UserSecurityRecord;
  roles: SecurityOption[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <Button variant={mode === "create" ? "primary" : "secondary"} size={mode === "create" ? "md" : "sm"} onClick={() => setOpen(true)}>
        {mode === "create" ? <Plus className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
        {mode === "create" ? "Tambah User" : "Edit"}
      </Button>
      {open ? (
        <form action={formAction}>
          <MasterRecordForm
            title={mode === "create" ? "Tambah User" : "Edit User"}
            description="Kelola akun login, role, dan direct permission."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <Feedback state={state} />
            {record ? <input name="id" type="hidden" value={record.id} /> : null}
            <label className="block">
              <span className="text-sm font-medium text-[var(--text)]">Nama</span>
              <Input name="name" defaultValue={record?.name ?? ""} className="mt-2" required />
              <FieldError message={state.errors?.name} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--text)]">Email</span>
              <Input name="email" type="email" defaultValue={record?.email ?? ""} className="mt-2" required />
              <FieldError message={state.errors?.email} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-[var(--text)]">
                Password {mode === "edit" ? <span className="text-[var(--muted)]">(kosongkan jika tidak diubah)</span> : null}
              </span>
              <Input name="password" type="password" className="mt-2" required={mode === "create"} minLength={8} />
              <FieldError message={state.errors?.password} />
            </label>
            <CheckboxGroup
              name="roleIds"
              title="Role"
              options={roles}
              selectedIds={record?.roleIds ?? []}
              error={state.errors?.roleIds}
            />
            <CheckboxGroup
              name="permissionIds"
              title="Direct Permission"
              options={permissions}
              selectedIds={record?.permissionIds ?? []}
              error={state.errors?.permissionIds}
            />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function RoleForm({
  action,
  mode,
  permissions,
  record,
}: {
  action: SecurityAction;
  mode: "create" | "edit";
  permissions: SecurityOption[];
  record?: RoleSecurityRecord;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <Button variant={mode === "create" ? "primary" : "secondary"} size={mode === "create" ? "md" : "sm"} onClick={() => setOpen(true)}>
        {mode === "create" ? <Plus className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
        {mode === "create" ? "Tambah Role" : "Edit"}
      </Button>
      {open ? (
        <form action={formAction}>
          <MasterRecordForm
            title={mode === "create" ? "Tambah Role" : "Edit Role"}
            description="Role mengelompokkan permission untuk user."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <Feedback state={state} />
            {record ? <input name="id" type="hidden" value={record.id} /> : null}
            <label className="block">
              <span className="text-sm font-medium text-[var(--text)]">Nama Role</span>
              <Input name="name" defaultValue={record?.name ?? ""} className="mt-2" required />
              <FieldError message={state.errors?.name} />
            </label>
            <CheckboxGroup
              name="permissionIds"
              title="Permission"
              options={permissions}
              selectedIds={record?.permissionIds ?? []}
              error={state.errors?.permissionIds}
            />
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

function PermissionForm({
  action,
  mode,
  record,
}: {
  action: SecurityAction;
  mode: "create" | "edit";
  record?: PermissionSecurityRecord;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  return (
    <>
      <Button variant={mode === "create" ? "primary" : "secondary"} size={mode === "create" ? "md" : "sm"} onClick={() => setOpen(true)}>
        {mode === "create" ? <Plus className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
        {mode === "create" ? "Tambah Permission" : "Edit"}
      </Button>
      {open ? (
        <form action={formAction}>
          <MasterRecordForm
            title={mode === "create" ? "Tambah Permission" : "Edit Permission"}
            description="Permission dipakai untuk server-side access control."
            onClose={() => setOpen(false)}
            footer={
              <Button type="submit" disabled={pending}>
                {pending ? "Menyimpan..." : "Simpan"}
              </Button>
            }
          >
            <Feedback state={state} />
            {record ? <input name="id" type="hidden" value={record.id} /> : null}
            <label className="block">
              <span className="text-sm font-medium text-[var(--text)]">Nama Permission</span>
              <Input name="name" defaultValue={record?.name ?? ""} className="mt-2" required />
              <FieldError message={state.errors?.name} />
            </label>
          </MasterRecordForm>
        </form>
      ) : null}
    </>
  );
}

export function UsersSecurityClient({
  permissions,
  roles,
  users,
}: {
  permissions: SecurityOption[];
  roles: SecurityOption[];
  users: UserSecurityRecord[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Daftar User</CardTitle>
        <UserForm action={createUserAction} mode="create" roles={roles} permissions={permissions} />
      </CardHeader>
      <CardContent>
        <DataTable
          columns={["Nama", "Email", "Role", "Direct Permission", "Dibuat", "Action"]}
          rows={users.map((user) => [
            user.name,
            user.email,
            <BadgeList key="roles" labels={user.roles} />,
            <BadgeList key="permissions" labels={user.directPermissions} variant="info" />,
            user.createdAt,
            <div key="actions" className="flex flex-wrap gap-2">
              <UserForm action={updateUserAction} mode="edit" record={user} roles={roles} permissions={permissions} />
              <DeleteButton
                action={deleteUserAction}
                id={user.id}
                title="Hapus User"
                description={`User ${user.email} akan dihapus. Jika schema belum memiliki soft delete, data user akan dihapus permanen.`}
              />
            </div>,
          ])}
          emptyTitle="Belum ada user."
        />
      </CardContent>
    </Card>
  );
}

export function RolesSecurityClient({
  permissions,
  roles,
}: {
  permissions: SecurityOption[];
  roles: RoleSecurityRecord[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Daftar Role</CardTitle>
        <RoleForm action={createRoleAction} mode="create" permissions={permissions} />
      </CardHeader>
      <CardContent>
        <DataTable
          columns={["Nama", "Guard", "Permission", "User", "Dibuat", "Action"]}
          rows={roles.map((role) => [
            role.name,
            role.guardName,
            <BadgeList key="permissions" labels={role.permissions} variant="info" />,
            role.userCount,
            role.createdAt,
            <div key="actions" className="flex flex-wrap gap-2">
              <RoleForm action={updateRoleAction} mode="edit" record={role} permissions={permissions} />
              <DeleteButton
                action={deleteRoleAction}
                id={role.id}
                title="Hapus Role"
                description={`Role ${role.name} hanya bisa dihapus jika belum dipakai user.`}
              />
            </div>,
          ])}
          emptyTitle="Belum ada role."
        />
      </CardContent>
    </Card>
  );
}

export function PermissionsSecurityClient({ permissions }: { permissions: PermissionSecurityRecord[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Daftar Permission</CardTitle>
        <PermissionForm action={createPermissionAction} mode="create" />
      </CardHeader>
      <CardContent>
        <DataTable
          columns={["Nama", "Guard", "Dipakai Role", "Dipakai User", "Dibuat", "Action"]}
          rows={permissions.map((permission) => [
            permission.name,
            permission.guardName,
            permission.roleCount,
            permission.userCount,
            permission.createdAt,
            <div key="actions" className="flex flex-wrap gap-2">
              <PermissionForm action={updatePermissionAction} mode="edit" record={permission} />
              <DeleteButton
                action={deletePermissionAction}
                id={permission.id}
                title="Hapus Permission"
                description={`Permission ${permission.name} hanya bisa dihapus jika belum dipakai role atau user.`}
              />
            </div>,
          ])}
          emptyTitle="Belum ada permission."
        />
      </CardContent>
    </Card>
  );
}
