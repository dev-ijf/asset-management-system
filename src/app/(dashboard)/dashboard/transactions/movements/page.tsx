import { MyRequestsCard } from "@/components/approvals/my-requests-card";
import { ApprovalTransactionType } from "@/generated/prisma/client";
import { MovementForm } from "@/components/transactions/transaction-forms";
import type { Prisma } from "@/generated/prisma/client";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/tables/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, getTransactionOptions, requireAnyPermission } from "@/lib/asset-transaction-view";
import { prisma } from "@/lib/prisma";
import { movementChangeText } from "@/lib/movement-display";
import { paginate } from "@/lib/pagination";

import { FilterField, FilterPanel } from "@/components/tables/filter-panel";
import { DateRangeAlert, DateRangeInputs } from "@/components/ui/date-range-inputs";
import { parseDateRange } from "@/lib/date-range";
import { Select } from "@/components/ui/select";
import { assetLocationFilter } from "@/lib/location-filter";
import { locationPathOptions } from "@/lib/location-tree";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; limit?: string; from?: string; to?: string; toLocation?: string }>;
};

export default async function MovementsPage({ searchParams }: PageProps) {
  const user = await requireAnyPermission(["assets.view", "movements.manage"]);
  const params = await searchParams;
  const { q = "" } = params;
  const options = await getTransactionOptions("movement");

  const range = parseDateRange(params.from, params.to);
  const locationChoices = locationPathOptions(
    await prisma.assetLocation.findMany({ select: { id: true, code: true, name: true, parentId: true } }),
  );
  const where: Prisma.AssetMovementWhereInput = {
    ...(q
      ? {
          asset: {
            OR: [
              { code: { contains: q, mode: "insensitive" as const } },
              { name: { contains: q, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
      // A reversed range matches nothing; the alert above the table explains why.
      ...(range.error ? { id: { in: [] } } : {}),
      createdAt: range.filter,
      toLocationId: await assetLocationFilter(params.toLocation),
    };
  const activeFilters = [params.toLocation, params.from, params.to].filter(Boolean).length;
  const { items: movements, pagination } = await paginate(params,
    () => prisma.assetMovement.count({ where }),
    ({ skip, take }) => prisma.assetMovement.findMany({ where, skip, take, include: {
      asset: true,
      fromLocation: true,
      toLocation: true,
      fromDepartment: true,
      toDepartment: true,
      fromAssetUser: true,
      toAssetUser: true,
      performedBy: { select: { name: true } },
    }, orderBy: { createdAt: "desc" } }),
  );

  return (
    <>
      <PageHeader title="Movement Aset" subtitle="Catat perpindahan lokasi, departemen, atau asset user." />
      <div className="space-y-5">
        <MovementForm assets={options.assets} locations={options.locations} departments={options.departments} users={options.users} />
        <MyRequestsCard userId={user.id} types={[ApprovalTransactionType.MOVEMENT]} />
        <Card>
          <CardContent className="space-y-4">
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={q}
                searchPlaceholder="Cari code atau name asset"
                activeCount={activeFilters}
                resetHref={q ? `/dashboard/transactions/movements?q=${encodeURIComponent(q)}` : "/dashboard/transactions/movements"}
              >
                <FilterField label="Ke lokasi">
                  <Select name="toLocation" defaultValue={params.toLocation ?? ""}>
                    <option value="">Semua lokasi</option>
                    {locationChoices.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </Select>
                </FilterField>
                <DateRangeInputs from={params.from} to={params.to} labelled />
              </FilterPanel>
            </form>
            <DateRangeAlert message={range.error} />
            {movements.length === 0 ? (
              <EmptyState title="Belum ada data movement." description="Movement yang dibuat akan tampil di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-xs">
                  <thead className="whitespace-nowrap bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-3 py-2">No</th>
                      <th className="px-3 py-2">Asset</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2">Asset User</th>
                      <th className="px-3 py-2">Performed At</th>
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {movements.map((movement, index) => (
                      <tr key={movement.id}>
                        <td className="px-3 py-2">{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                        <td className="px-3 py-2 font-medium">{movement.asset.code} - {movement.asset.name}</td>
                        <td className="px-3 py-2">{movementChangeText(movement.fromLocation, movement.toLocationId, movement.toLocation)}</td>
                        <td className="px-3 py-2">{movementChangeText(movement.fromDepartment, movement.toDepartmentId, movement.toDepartment)}</td>
                        <td className="px-3 py-2">{movementChangeText(movement.fromAssetUser, movement.toAssetUserId, movement.toAssetUser)}</td>
                        <td className="px-3 py-2">{formatDate(movement.performedAt)}</td>
                        <td className="px-3 py-2">{movement.notes ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination {...pagination} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
