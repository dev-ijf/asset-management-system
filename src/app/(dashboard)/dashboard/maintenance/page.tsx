import {
  MaintenanceCompleteButton,
  MaintenanceCreateForm,
  MaintenanceDeleteButton,
  MaintenanceEditForm,
} from "@/components/transactions/transaction-forms";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { formatDate, formatMoney, getTransactionOptions, requireAnyPermission } from "@/lib/asset-transaction-view";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

function dateInput(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function MaintenancePage({ searchParams }: PageProps) {
  await requireAnyPermission(["assets.view", "maintenance.manage"]);
  const { q = "" } = await searchParams;
  const options = await getTransactionOptions();

  const maintenances = await prisma.assetMaintenance.findMany({
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
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="Maintenance Aset" subtitle="Kelola perawatan asset basic tanpa approval workflow." />
      <div className="space-y-5">
        <MaintenanceCreateForm assets={options.assets} />
        <Card>
          <CardContent className="space-y-4">
            <form>
              <Input name="q" defaultValue={q} placeholder="Search asset code/name..." />
            </form>
            {maintenances.length === 0 ? (
              <EmptyState title="Belum ada data maintenance." description="Maintenance yang dibuat akan tampil di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-4 py-3">No</th>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Schedule</th>
                      <th className="px-4 py-3">Completed</th>
                      <th className="px-4 py-3">Cost</th>
                      <th className="px-4 py-3">Vendor</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {maintenances.map((maintenance, index) => {
                      const editData = {
                        completedDate: dateInput(maintenance.completedDate),
                        cost: maintenance.cost?.toString() ?? "",
                        description: maintenance.description,
                        id: maintenance.id,
                        notes: maintenance.notes ?? "",
                        scheduledDate: dateInput(maintenance.scheduledDate),
                        status: maintenance.status,
                        vendor: maintenance.vendor ?? "",
                      };
                      return (
                        <tr key={maintenance.id} className="align-top">
                          <td className="px-4 py-3">{index + 1}</td>
                          <td className="px-4 py-3 font-medium">{maintenance.asset.code} - {maintenance.asset.name}</td>
                          <td className="px-4 py-3">{maintenance.description}</td>
                          <td className="px-4 py-3"><Badge variant={maintenance.status === "COMPLETED" ? "success" : "warning"}>{maintenance.status}</Badge></td>
                          <td className="px-4 py-3">{formatDate(maintenance.scheduledDate)}</td>
                          <td className="px-4 py-3">{formatDate(maintenance.completedDate)}</td>
                          <td className="px-4 py-3">{formatMoney(maintenance.cost)}</td>
                          <td className="px-4 py-3">{maintenance.vendor ?? "-"}</td>
                          <td className="space-y-2 px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              <MaintenanceEditForm maintenance={editData} />
                              <MaintenanceCompleteButton maintenance={editData} />
                              <MaintenanceDeleteButton id={maintenance.id} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
