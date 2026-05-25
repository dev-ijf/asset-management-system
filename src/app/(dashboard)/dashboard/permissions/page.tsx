import { PageHeader } from "@/components/layout/page-header";
import { PermissionsSecurityClient, type PermissionSecurityRecord } from "@/components/security/security-management-client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export default async function PermissionsPage() {
  await requirePermission("permissions.manage");

  const permissions = await prisma.permission.findMany({
    where: { guardName: "web" },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { roles: true, users: true } },
    },
  });

  const records: PermissionSecurityRecord[] = permissions.map((permission) => ({
    id: permission.id,
    name: permission.name,
    guardName: permission.guardName,
    roleCount: permission._count.roles,
    userCount: permission._count.users,
    createdAt: formatDate(permission.createdAt),
  }));

  return (
    <>
      <PageHeader title="Permission Management" subtitle="Kelola daftar permission untuk server-side authorization." />
      <PermissionsSecurityClient permissions={records} />
    </>
  );
}
