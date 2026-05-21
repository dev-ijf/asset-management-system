import { MovementForm } from "@/components/transactions/transaction-forms";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, getTransactionOptions, requireAnyPermission } from "@/lib/asset-transaction-view";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function MovementsPage({ searchParams }: PageProps) {
  await requireAnyPermission(["assets.view", "movements.manage"]);
  const { q = "" } = await searchParams;
  const options = await getTransactionOptions();

  const movements = await prisma.assetMovement.findMany({
    where: q
      ? {
          asset: {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
            ],
          },
        }
      : undefined,
    include: {
      asset: true,
      fromLocation: true,
      toLocation: true,
      fromDepartment: true,
      toDepartment: true,
      fromAssetUser: true,
      toAssetUser: true,
      performedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Movement Aset" subtitle="Catat perpindahan lokasi, departemen, atau asset user." />
      <div className="space-y-5">
        <MovementForm assets={options.assets} locations={options.locations} departments={options.departments} users={options.users} />
        <Card>
          <CardContent className="space-y-4">
            <form>
              <Input name="q" defaultValue={q} placeholder="Search asset code/name..." />
            </form>
            {movements.length === 0 ? (
              <EmptyState title="Belum ada data movement." description="Movement yang dibuat akan tampil di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Department</th>
                      <th className="px-4 py-3">Asset User</th>
                      <th className="px-4 py-3">Performed At</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {movements.map((movement, index) => (
                      <tr key={movement.id}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{movement.asset.code} - {movement.asset.name}</td>
                        <td className="px-4 py-3">{movement.fromLocation?.name ?? "-"} {"->"} {movement.toLocation?.name ?? "-"}</td>
                        <td className="px-4 py-3">{movement.fromDepartment?.name ?? "-"} {"->"} {movement.toDepartment?.name ?? "-"}</td>
                        <td className="px-4 py-3">{movement.fromAssetUser?.name ?? "-"} {"->"} {movement.toAssetUser?.name ?? "-"}</td>
                        <td className="px-4 py-3">{formatDate(movement.performedAt)}</td>
                        <td className="px-4 py-3">{movement.notes ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
