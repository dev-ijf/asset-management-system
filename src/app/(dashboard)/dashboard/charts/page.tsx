import { KpiCharts } from "@/components/dashboard/kpi-charts";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireAnyPermission } from "@/lib/asset-transaction-view";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function monthKey(date: Date) {
  return new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(date);
}

function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return { date, label: monthKey(date), value: 0 };
  });
}

function buildTrend<T extends { date: Date }>(rows: T[]) {
  const months = lastSixMonths();
  const map = new Map(months.map((month) => [month.label, month.value]));

  for (const row of rows) {
    const key = monthKey(row.date);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }

  return months.map((month) => ({ label: month.label, value: map.get(month.label) ?? 0 }));
}

export default async function ChartsPage() {
  await requireAnyPermission(["assets.view", "reports.view"]);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [statusGroups, categoryGroups, locationGroups, movements, disposals] = await Promise.all([
    prisma.asset.groupBy({
      by: ["assetStatusId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.asset.groupBy({
      by: ["assetCategoryId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.asset.groupBy({
      by: ["assetLocationId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.assetMovement.findMany({ where: { performedAt: { gte: sixMonthsAgo } }, select: { performedAt: true } }),
    prisma.assetDisposal.findMany({ where: { disposedAt: { gte: sixMonthsAgo } }, select: { disposedAt: true } }),
  ]);

  const [statuses, categories, locations] = await Promise.all([
    prisma.assetStatus.findMany({ select: { id: true, name: true } }),
    prisma.assetCategory.findMany({ select: { id: true, name: true } }),
    prisma.assetLocation.findMany({ select: { id: true, name: true } }),
  ]);

  const statusNames = new Map(statuses.map((item) => [item.id, item.name]));
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));
  const locationNames = new Map(locations.map((item) => [item.id, item.name]));

  const assetByStatus = statusGroups.map((group) => ({ label: group.assetStatusId ? statusNames.get(group.assetStatusId) ?? "Unknown" : "Unassigned", value: group._count._all }));
  const assetByCategory = categoryGroups.map((group) => ({ label: group.assetCategoryId ? categoryNames.get(group.assetCategoryId) ?? "Unknown" : "Unassigned", value: group._count._all }));
  const assetByLocation = locationGroups.map((group) => ({ label: group.assetLocationId ? locationNames.get(group.assetLocationId) ?? "Unknown" : "Unassigned", value: group._count._all }));

  return (
    <>
      <PageHeader title="Dashboard Chart & KPI" subtitle="Visualisasi data asset, movement, disposal, dan audit untuk MVP+." />
      <Card className="mb-5">
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div><p className="text-sm text-[var(--muted)]">Total Asset</p><p className="mt-1 text-2xl font-semibold">{assetByStatus.reduce((sum, item) => sum + item.value, 0)}</p></div>
          <div><p className="text-sm text-[var(--muted)]">Movement 6 Bulan</p><p className="mt-1 text-2xl font-semibold">{movements.length}</p></div>
          <div><p className="text-sm text-[var(--muted)]">Disposal 6 Bulan</p><p className="mt-1 text-2xl font-semibold">{disposals.length}</p></div>
          <div><p className="text-sm text-[var(--muted)]">Kategori Aktif</p><p className="mt-1 text-2xl font-semibold">{assetByCategory.length}</p></div>
        </CardContent>
      </Card>
      <KpiCharts
        assetByCategory={assetByCategory}
        assetByLocation={assetByLocation}
        assetByStatus={assetByStatus}
        movementTrend={buildTrend(movements.map((movement) => ({ date: movement.performedAt })))}
        disposalTrend={buildTrend(disposals.map((disposal) => ({ date: disposal.disposedAt })))}
      />
    </>
  );
}
