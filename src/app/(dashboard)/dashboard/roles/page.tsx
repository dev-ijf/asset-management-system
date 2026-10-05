import { PageHeader } from "@/components/layout/page-header";
import { RolesSecurityClient, type RoleSecurityRecord, type SecurityOption } from "@/components/security/security-management-client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { paginate } from "@/lib/pagination";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default async function RolesPage({ searchParams }: { searchParams: Promise<{ page?: string; limit?: string }> }) {
  await requirePermission("roles.manage");
  const params = await searchParams;

  const [{ items: roles, pagination }, permissions] = await Promise.all([
    paginate(params, () => prisma.role.count({ where: { guardName: "web" } }), ({ skip, take }) => prisma.role.findMany({ skip, take,
      where: { guardName: "web" },
      orderBy: { name: "asc" },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    })),
    prisma.permission.findMany({ where: { guardName: "web" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const permissionOptions: SecurityOption[] = permissions.map((permission) => ({ id: permission.id, name: permission.name }));
  const records: RoleSecurityRecord[] = roles.map((role) => ({
    id: role.id,
    name: role.name,
    guardName: role.guardName,
    permissionIds: role.permissions.map((item) => item.permissionId),
    permissions: role.permissions.map((item) => item.permission.name),
    userCount: role._count.users,
    createdAt: formatDate(role.createdAt),
  }));

  return (
    <>
      <PageHeader title="Role Management" subtitle="Kelola role dan permission yang melekat pada role." />
      <RolesSecurityClient roles={records} permissions={permissionOptions} pagination={pagination} />
    </>
  );
}
