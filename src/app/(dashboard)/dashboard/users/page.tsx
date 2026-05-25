import { PageHeader } from "@/components/layout/page-header";
import { UsersSecurityClient, type SecurityOption, type UserSecurityRecord } from "@/components/security/security-management-client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default async function UsersPage() {
  await requirePermission("users.manage");

  const [users, roles, permissions] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        roles: { include: { role: true } },
        directPermissions: { include: { permission: true } },
      },
    }),
    prisma.role.findMany({ where: { guardName: "web" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.permission.findMany({ where: { guardName: "web" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const roleOptions: SecurityOption[] = roles.map((role) => ({ id: role.id, name: role.name }));
  const permissionOptions: SecurityOption[] = permissions.map((permission) => ({ id: permission.id, name: permission.name }));
  const records: UserSecurityRecord[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roleIds: user.roles.map((item) => item.roleId),
    permissionIds: user.directPermissions.map((item) => item.permissionId),
    roles: user.roles.map((item) => item.role.name),
    directPermissions: user.directPermissions.map((item) => item.permission.name),
    createdAt: formatDate(user.createdAt),
  }));

  return (
    <>
      <PageHeader title="User Management" subtitle="Kelola akun login, role, dan direct permission." />
      <UsersSecurityClient users={records} roles={roleOptions} permissions={permissionOptions} />
    </>
  );
}
