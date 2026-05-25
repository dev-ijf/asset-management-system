"use server";

import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SecurityActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string | undefined>;
};

const SECURITY_PATHS = ["/dashboard/users", "/dashboard/roles", "/dashboard/permissions", "/dashboard/security"];

function revalidateSecurityPaths() {
  for (const path of SECURITY_PATHS) {
    revalidatePath(path);
  }
}

function fieldValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function selectedIds(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function fail(message: string, errors?: Record<string, string | undefined>): SecurityActionState {
  return { ok: false, message, errors };
}

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function ensureRolesExist(roleIds: string[]) {
  if (roleIds.length === 0) return true;
  const count = await prisma.role.count({ where: { id: { in: roleIds }, guardName: "web" } });
  return count === new Set(roleIds).size;
}

async function ensurePermissionsExist(permissionIds: string[]) {
  if (permissionIds.length === 0) return true;
  const count = await prisma.permission.count({ where: { id: { in: permissionIds }, guardName: "web" } });
  return count === new Set(permissionIds).size;
}

async function wouldRemoveLastSuperAdmin(userId: string, nextRoleIds?: string[]) {
  const superAdmin = await prisma.role.findUnique({
    where: { name_guardName: { name: "super-admin", guardName: "web" } },
    select: { id: true },
  });

  if (!superAdmin) return false;

  const targetHasSuperAdmin = await prisma.userRole.findUnique({
    where: { userId_roleId: { userId, roleId: superAdmin.id } },
  });

  if (!targetHasSuperAdmin) return false;
  if (nextRoleIds?.includes(superAdmin.id)) return false;

  const superAdminUsers = await prisma.userRole.count({ where: { roleId: superAdmin.id } });
  return superAdminUsers <= 1;
}

export async function createUserAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  await requirePermission("users.manage");

  const name = fieldValue(formData, "name");
  const email = fieldValue(formData, "email").toLowerCase();
  const password = fieldValue(formData, "password");
  const roleIds = selectedIds(formData, "roleIds");
  const permissionIds = selectedIds(formData, "permissionIds");
  const errors: Record<string, string | undefined> = {};

  if (!name) errors.name = "Nama wajib diisi.";
  if (!email) errors.email = "Email wajib diisi.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Format email tidak valid.";
  if (!password) errors.password = "Password wajib diisi.";
  if (password && password.length < 8) errors.password = "Password minimal 8 karakter.";
  if (!(await ensureRolesExist(roleIds))) errors.roleIds = "Role yang dipilih tidak valid.";
  if (!(await ensurePermissionsExist(permissionIds))) errors.permissionIds = "Permission yang dipilih tidak valid.";

  if (Object.keys(errors).length > 0) {
    return fail("Periksa kembali input user.", errors);
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: passwordHash,
        },
      });

      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: [...new Set(roleIds)].map((roleId) => ({ userId: user.id, roleId })),
          skipDuplicates: true,
        });
      }

      if (permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: [...new Set(permissionIds)].map((permissionId) => ({ userId: user.id, permissionId })),
          skipDuplicates: true,
        });
      }
    });

    revalidateSecurityPaths();
    return { ok: true, message: "User berhasil dibuat." };
  } catch (error) {
    if (isUniqueError(error)) {
      return fail("Email sudah digunakan.", { email: "Email harus unique." });
    }

    return fail("User gagal dibuat.");
  }
}

export async function updateUserAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  await requirePermission("users.manage");

  const id = fieldValue(formData, "id");
  const name = fieldValue(formData, "name");
  const email = fieldValue(formData, "email").toLowerCase();
  const password = fieldValue(formData, "password");
  const roleIds = selectedIds(formData, "roleIds");
  const permissionIds = selectedIds(formData, "permissionIds");
  const errors: Record<string, string | undefined> = {};

  if (!id) errors.id = "User tidak valid.";
  if (!name) errors.name = "Nama wajib diisi.";
  if (!email) errors.email = "Email wajib diisi.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Format email tidak valid.";
  if (password && password.length < 8) errors.password = "Password minimal 8 karakter.";
  if (!(await ensureRolesExist(roleIds))) errors.roleIds = "Role yang dipilih tidak valid.";
  if (!(await ensurePermissionsExist(permissionIds))) errors.permissionIds = "Permission yang dipilih tidak valid.";
  if (id && (await wouldRemoveLastSuperAdmin(id, roleIds))) {
    errors.roleIds = "Tidak boleh menghapus role super-admin terakhir.";
  }

  if (Object.keys(errors).length > 0) {
    return fail("Periksa kembali input user.", errors);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: {
          name,
          email,
          ...(password ? { password: await bcrypt.hash(password, 12) } : {}),
        },
      });

      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userPermission.deleteMany({ where: { userId: id } });

      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: [...new Set(roleIds)].map((roleId) => ({ userId: id, roleId })),
          skipDuplicates: true,
        });
      }

      if (permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: [...new Set(permissionIds)].map((permissionId) => ({ userId: id, permissionId })),
          skipDuplicates: true,
        });
      }
    });

    revalidateSecurityPaths();
    return { ok: true, message: "User berhasil diperbarui." };
  } catch (error) {
    if (isUniqueError(error)) {
      return fail("Email sudah digunakan.", { email: "Email harus unique." });
    }

    return fail("User gagal diperbarui.");
  }
}

export async function deleteUserAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  const currentUser = await requirePermission("users.manage");
  const id = fieldValue(formData, "id");

  if (!id) return fail("User tidak valid.");
  if (id === currentUser.id) return fail("User yang sedang login tidak boleh dihapus.");
  if (await wouldRemoveLastSuperAdmin(id)) return fail("Tidak boleh menghapus user super-admin terakhir.");

  try {
    await prisma.user.delete({ where: { id } });
    revalidateSecurityPaths();
    return { ok: true, message: "User berhasil dihapus." };
  } catch {
    return fail("User gagal dihapus.");
  }
}

export async function createRoleAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  await requirePermission("roles.manage");

  const name = fieldValue(formData, "name");
  const permissionIds = selectedIds(formData, "permissionIds");
  const errors: Record<string, string | undefined> = {};

  if (!name) errors.name = "Nama role wajib diisi.";
  if (!(await ensurePermissionsExist(permissionIds))) errors.permissionIds = "Permission yang dipilih tidak valid.";

  if (Object.keys(errors).length > 0) {
    return fail("Periksa kembali input role.", errors);
  }

  try {
    await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({ data: { name, guardName: "web" } });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: [...new Set(permissionIds)].map((permissionId) => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
      }
    });

    revalidateSecurityPaths();
    return { ok: true, message: "Role berhasil dibuat." };
  } catch (error) {
    if (isUniqueError(error)) {
      return fail("Nama role sudah digunakan.", { name: "Nama role harus unique." });
    }

    return fail("Role gagal dibuat.");
  }
}

export async function updateRoleAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  await requirePermission("roles.manage");

  const id = fieldValue(formData, "id");
  const name = fieldValue(formData, "name");
  const permissionIds = selectedIds(formData, "permissionIds");
  const existing = id ? await prisma.role.findUnique({ where: { id }, select: { name: true } }) : null;
  const errors: Record<string, string | undefined> = {};

  if (!id || !existing) errors.id = "Role tidak valid.";
  if (!name) errors.name = "Nama role wajib diisi.";
  if (existing?.name === "super-admin" && name !== "super-admin") {
    errors.name = "Role super-admin tidak boleh diganti namanya.";
  }
  if (!(await ensurePermissionsExist(permissionIds))) errors.permissionIds = "Permission yang dipilih tidak valid.";

  if (Object.keys(errors).length > 0) {
    return fail("Periksa kembali input role.", errors);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.role.update({ where: { id }, data: { name } });
      await tx.rolePermission.deleteMany({ where: { roleId: id } });

      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: [...new Set(permissionIds)].map((permissionId) => ({ roleId: id, permissionId })),
          skipDuplicates: true,
        });
      }
    });

    revalidateSecurityPaths();
    return { ok: true, message: "Role berhasil diperbarui." };
  } catch (error) {
    if (isUniqueError(error)) {
      return fail("Nama role sudah digunakan.", { name: "Nama role harus unique." });
    }

    return fail("Role gagal diperbarui.");
  }
}

export async function deleteRoleAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  await requirePermission("roles.manage");
  const id = fieldValue(formData, "id");

  if (!id) return fail("Role tidak valid.");

  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!role) return fail("Role tidak ditemukan.");
  if (role.name === "super-admin") return fail("Role super-admin tidak boleh dihapus.");
  if (role._count.users > 0) return fail(`Role masih dipakai oleh ${role._count.users} user.`);

  try {
    await prisma.role.delete({ where: { id } });
    revalidateSecurityPaths();
    return { ok: true, message: "Role berhasil dihapus." };
  } catch {
    return fail("Role gagal dihapus.");
  }
}

export async function createPermissionAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  await requirePermission("permissions.manage");
  const name = fieldValue(formData, "name");

  if (!name) {
    return fail("Periksa kembali input permission.", { name: "Nama permission wajib diisi." });
  }

  try {
    await prisma.permission.create({ data: { name, guardName: "web" } });
    revalidateSecurityPaths();
    return { ok: true, message: "Permission berhasil dibuat." };
  } catch (error) {
    if (isUniqueError(error)) {
      return fail("Nama permission sudah digunakan.", { name: "Nama permission harus unique." });
    }

    return fail("Permission gagal dibuat.");
  }
}

export async function updatePermissionAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  await requirePermission("permissions.manage");
  const id = fieldValue(formData, "id");
  const name = fieldValue(formData, "name");

  if (!id) return fail("Permission tidak valid.");
  if (!name) return fail("Periksa kembali input permission.", { name: "Nama permission wajib diisi." });

  try {
    await prisma.permission.update({ where: { id }, data: { name } });
    revalidateSecurityPaths();
    return { ok: true, message: "Permission berhasil diperbarui." };
  } catch (error) {
    if (isUniqueError(error)) {
      return fail("Nama permission sudah digunakan.", { name: "Nama permission harus unique." });
    }

    return fail("Permission gagal diperbarui.");
  }
}

export async function deletePermissionAction(_: SecurityActionState, formData: FormData): Promise<SecurityActionState> {
  await requirePermission("permissions.manage");
  const id = fieldValue(formData, "id");

  if (!id) return fail("Permission tidak valid.");

  const permission = await prisma.permission.findUnique({
    where: { id },
    include: { _count: { select: { roles: true, users: true } } },
  });

  if (!permission) return fail("Permission tidak ditemukan.");
  if (permission._count.roles > 0) return fail(`Permission masih dipakai oleh ${permission._count.roles} role.`);
  if (permission._count.users > 0) return fail(`Permission masih dipakai langsung oleh ${permission._count.users} user.`);

  try {
    await prisma.permission.delete({ where: { id } });
    revalidateSecurityPaths();
    return { ok: true, message: "Permission berhasil dihapus." };
  } catch {
    return fail("Permission gagal dihapus.");
  }
}
