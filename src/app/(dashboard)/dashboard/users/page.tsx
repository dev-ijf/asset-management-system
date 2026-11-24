import { PageHeader } from "@/components/layout/page-header";
import { UsersSecurityClient, type SecurityOption, type UserSecurityRecord } from "@/components/security/security-management-client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginate } from "@/lib/pagination";
import { wibFormat } from "@/lib/datetime";
import { buildLocationTree } from "@/lib/location-tree";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return wibFormat({ day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ page?: string; limit?: string }> }) {
  await requirePermission("users.manage");
  const params = await searchParams;

  const [{ items: users, pagination }, roles, permissions, locations] = await Promise.all([
    paginate(params, () => prisma.user.count(), ({ skip, take }) => prisma.user.findMany({ skip, take,
      orderBy: { createdAt: "desc" },
      include: {
        roles: { include: { role: true } },
        directPermissions: { include: { permission: true } },
      },
    })),
    prisma.role.findMany({ where: { guardName: "web" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.permission.findMany({ where: { guardName: "web" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.assetLocation.findMany({ select: { id: true, code: true, name: true, parentId: true } }),
  ]);
  const locationTree = buildLocationTree(locations);
  const locationPath = new Map(locationTree.map((item) => [item.id, item.path]));
  const locationOptions: SecurityOption[] = locationTree.map((item) => ({ id: item.id, name: item.path }));

  const roleOptions: SecurityOption[] = roles.map((role) => ({ id: role.id, name: role.name }));
  const permissionOptions: SecurityOption[] = permissions.map((permission) => ({ id: permission.id, name: permission.name }));
  const records: UserSecurityRecord[] = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roleIds: user.roles.map((item) => item.roleId),
    permissionIds: user.directPermissions.map((item) => item.permissionId),
    assetLocationId: user.assetLocationId,
    classLocation: user.assetLocationId ? locationPath.get(user.assetLocationId) ?? null : null,
    roles: user.roles.map((item) => item.role.name),
    directPermissions: user.directPermissions.map((item) => item.permission.name),
    createdAt: formatDate(user.createdAt),
  }));

  return (
    <>
      <PageHeader title="User Management" subtitle="Kelola akun login, role, dan direct permission." />
      <UsersSecurityClient users={records} roles={roleOptions} permissions={permissionOptions} locations={locationOptions} pagination={pagination} />
    </>
  );
}
