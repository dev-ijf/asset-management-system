import Link from "next/link";
import { Activity, Package, Repeat2, ShieldCheck, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/tables/data-table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type DistributionItem = {
  label: string;
  value: number;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function compactDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function assetLabel(asset: { code: string; name: string } | null | undefined) {
  if (!asset) return "-";
  return `${asset.code} - ${asset.name}`;
}

function buildDistribution<T extends { _count: { _all: number } }>(
  groups: T[],
  getId: (group: T) => string | null,
  names: Map<string, string>,
  fallback: string,
  limit = 10,
): DistributionItem[] {
  return groups
    .map((group) => {
      const id = getId(group);
      return {
        label: id ? names.get(id) ?? "Unknown" : fallback,
        value: group._count._all,
      };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function DistributionBars({ items, emptyTitle }: { items: DistributionItem[]; emptyTitle: string }) {
  if (items.length === 0) {
    return <p className="rounded-md border border-dashed border-[var(--border)] p-5 text-sm text-[var(--muted)]">{emptyTitle}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-[var(--text)]">{item.label}</span>
            <span className="text-[var(--muted)]">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--primary-soft)]">
            <div
              className="h-2 rounded-full bg-[var(--primary)]"
              style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function buildTrendRows({
  movements,
  disposals,
  auditIssues,
  from,
}: {
  movements: { performedAt: Date }[];
  disposals: { disposedAt: Date }[];
  auditIssues: { auditedAt: Date }[];
  from: Date;
}) {
  const days = Array.from({ length: 14 }, (_, index) => startOfDay(addDays(from, index)));
  const rows = days.map((date) => ({
    date,
    movement: 0,
    disposal: 0,
    auditIssue: 0,
  }));

  const indexByKey = new Map(rows.map((row, index) => [row.date.toISOString().slice(0, 10), index]));
  const increment = (date: Date, key: "movement" | "disposal" | "auditIssue") => {
    const index = indexByKey.get(startOfDay(date).toISOString().slice(0, 10));
    if (index !== undefined) rows[index][key] += 1;
  };

  for (const movement of movements) increment(movement.performedAt, "movement");
  for (const disposal of disposals) increment(disposal.disposedAt, "disposal");
  for (const audit of auditIssues) increment(audit.auditedAt, "auditIssue");

  return rows;
}

function TrendChart({
  rows,
}: {
  rows: { date: Date; movement: number; disposal: number; auditIssue: number }[];
}) {
  const max = Math.max(...rows.flatMap((row) => [row.movement, row.disposal, row.auditIssue]), 1);

  return (
    <div className="flex h-[300px] items-end gap-3 overflow-x-auto rounded border border-[var(--border)] bg-white p-6">
      {rows.map((row) => (
        <div key={row.date.toISOString()} className="flex min-w-12 flex-1 flex-col items-center justify-end gap-2">
          <div className="flex h-52 items-end gap-1">
            <span
              className="w-2 rounded-t bg-[#03a9e8]"
              title={`Movement: ${row.movement}`}
              style={{ height: `${Math.max(row.movement ? 8 : 2, (row.movement / max) * 100)}%` }}
            />
            <span
              className="w-2 rounded-t bg-[var(--warning)]"
              title={`Disposal: ${row.disposal}`}
              style={{ height: `${Math.max(row.disposal ? 8 : 2, (row.disposal / max) * 100)}%` }}
            />
            <span
              className="w-2 rounded-t bg-[var(--danger)]"
              title={`Audit issue: ${row.auditIssue}`}
              style={{ height: `${Math.max(row.auditIssue ? 8 : 2, (row.auditIssue / max) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-[var(--muted)]">{compactDate(row.date)}</span>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const today = startOfDay(new Date());
  const thirtyDaysAgo = startOfDay(addDays(today, -30));
  const thirtyDaysAhead = startOfDay(addDays(today, 30));
  const trendStart = startOfDay(addDays(today, -13));
  const issueStatuses = ["MISMATCH", "MISSING", "DAMAGED"] as const;

  const [
    totalAssets,
    archivedAssets,
    deletedAssets,
    movements30Days,
    activeDisposals,
    auditIssues,
    openMaintenances,
    lowStockConsumables,
    expiringWarranties,
    statusGroups,
    locationGroups,
    categoryGroups,
    statuses,
    locations,
    categories,
    trendMovements,
    trendDisposals,
    trendAuditIssues,
    recentAudits,
    recentDisposals,
    recentMovements,
  ] = await Promise.all([
    prisma.asset.count({ where: { deletedAt: null } }),
    prisma.asset.count({ where: { deletedAt: null, archivedAt: { not: null } } }),
    prisma.asset.count({ where: { deletedAt: { not: null } } }),
    prisma.assetMovement.count({ where: { performedAt: { gte: thirtyDaysAgo } } }),
    prisma.assetDisposal.count({ where: { reversedAt: null } }),
    prisma.assetAudit.count({ where: { status: { in: [...issueStatuses] } } }),
    prisma.assetMaintenance.count({ where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.asset.count({ where: { deletedAt: null, isConsumable: true, availableQuantity: { lte: 0 } } }),
    prisma.asset.count({
      where: {
        deletedAt: null,
        warrantyEnd: {
          gte: today,
          lte: thirtyDaysAhead,
        },
      },
    }),
    prisma.asset.groupBy({
      by: ["assetStatusId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.asset.groupBy({
      by: ["assetLocationId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.asset.groupBy({
      by: ["assetCategoryId"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
    prisma.assetStatus.findMany({ select: { id: true, name: true } }),
    prisma.assetLocation.findMany({ select: { id: true, name: true } }),
    prisma.assetCategory.findMany({ select: { id: true, name: true } }),
    prisma.assetMovement.findMany({ where: { performedAt: { gte: trendStart } }, select: { performedAt: true } }),
    prisma.assetDisposal.findMany({ where: { disposedAt: { gte: trendStart } }, select: { disposedAt: true } }),
    prisma.assetAudit.findMany({
      where: { auditedAt: { gte: trendStart }, status: { in: [...issueStatuses] } },
      select: { auditedAt: true },
    }),
    prisma.assetAudit.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { asset: { select: { code: true, name: true } } },
    }),
    prisma.assetDisposal.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { asset: { select: { code: true, name: true } } },
    }),
    prisma.assetMovement.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        asset: { select: { code: true, name: true } },
        fromLocation: { select: { name: true } },
        toLocation: { select: { name: true } },
      },
    }),
  ]);

  const statusNames = new Map(statuses.map((item) => [item.id, item.name]));
  const locationNames = new Map(locations.map((item) => [item.id, item.name]));
  const categoryNames = new Map(categories.map((item) => [item.id, item.name]));

  const assetsByStatus = buildDistribution(statusGroups, (group) => group.assetStatusId, statusNames, "Tanpa status");
  const assetsByLocation = buildDistribution(locationGroups, (group) => group.assetLocationId, locationNames, "Tanpa lokasi");
  const assetsByCategory = buildDistribution(categoryGroups, (group) => group.assetCategoryId, categoryNames, "Tanpa kategori");
  const trendRows = buildTrendRows({
    movements: trendMovements,
    disposals: trendDisposals,
    auditIssues: trendAuditIssues,
    from: trendStart,
  });

  const summaryCards = [
    {
      title: "Total Aset",
      value: totalAssets.toLocaleString("id-ID"),
      helper: `Arsip: ${archivedAssets.toLocaleString("id-ID")}  Trash: ${deletedAssets.toLocaleString("id-ID")}`,
      icon: Package,
      tone: "bg-[#eeeafe] text-[var(--primary)]",
    },
    {
      title: "Movement 30 hari",
      value: movements30Days.toLocaleString("id-ID"),
      helper: "Transaksi movement yang tercatat.",
      icon: Repeat2,
      tone: "bg-[#e4f8ff] text-[#03a9e8]",
    },
    {
      title: "Disposal Aktif",
      value: activeDisposals.toLocaleString("id-ID"),
      helper: "Belum di-reverse.",
      icon: Trash2,
      tone: "bg-[#fff5df] text-[var(--warning)]",
    },
    {
      title: "Audit Bermasalah",
      value: auditIssues.toLocaleString("id-ID"),
      helper: "Status mismatch/missing/damaged.",
      icon: ShieldCheck,
      tone: "bg-[#ffecea] text-[var(--danger)]",
    },
  ];

  const quickActions: Array<[string, string, number, string]> = [
    ["Maintenance Terbuka", "Status selain completed/cancelled.", openMaintenances, "/dashboard/maintenance"],
    ["Consumable Habis", "Consumable dengan available quantity <= 0.", lowStockConsumables, "/dashboard/assets"],
    ["Warranty Akan Habis", "Warranty end dalam 30 hari.", expiringWarranties, "/dashboard/reports/assets"],
    ["Approval Pending", "Workflow approval belum diaktifkan.", 0, "/dashboard/approvals"],
  ];

  const auditRows: ReactNode[][] = recentAudits.map((audit) => [
    assetLabel(audit.asset),
    <Badge key="status" variant={issueStatuses.includes(audit.status as (typeof issueStatuses)[number]) ? "danger" : "success"}>
      {audit.status}
    </Badge>,
    formatDate(audit.auditedAt),
    audit.notes || "-",
  ]);

  const disposalRows: ReactNode[][] = recentDisposals.map((disposal) => [
    assetLabel(disposal.asset),
    disposal.reason,
    formatDate(disposal.disposedAt),
    disposal.reversedAt ? <Badge key="status" variant="info">Reversed</Badge> : <Badge key="status" variant="warning">Aktif</Badge>,
  ]);

  const movementRows: ReactNode[][] = recentMovements.map((movement) => [
    assetLabel(movement.asset),
    movement.fromLocation?.name ?? "-",
    movement.toLocation?.name ?? "-",
    "Applied",
    formatDate(movement.performedAt),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Ringkasan operasional aset, risiko, transaksi, dan tindakan yang perlu ditindaklanjuti."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.title} className="min-h-36">
              <CardContent className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[var(--muted)]">{item.title}</p>
                  <p className="mt-2 text-3xl font-medium text-[var(--text)]">{item.value}</p>
                  <p className="mt-3 text-xs text-[var(--muted)]">{item.helper}</p>
                </div>
                <div className={`rounded-md p-3 ${item.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Tren Aktivitas (14 Hari)</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">Movement</Badge>
              <Badge variant="warning">Disposal</Badge>
              <Badge variant="danger">Audit Issues</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <TrendChart rows={trendRows} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tindak Lanjut Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {quickActions.map(([title, description, count, href]) => (
              <div key={title} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-[var(--text)]">{title}</p>
                  <p className="text-sm text-[var(--muted)]">{description}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--text)]">{count.toLocaleString("id-ID")}</p>
                  <Link href={href} className="text-sm text-[var(--primary)] hover:underline">
                    Buka
                  </Link>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="min-h-[360px]">
          <CardHeader>
            <CardTitle>Distribusi Aset per Status</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionBars items={assetsByStatus} emptyTitle="Belum ada aset untuk ditampilkan." />
          </CardContent>
        </Card>
        <Card className="min-h-[360px]">
          <CardHeader>
            <CardTitle>Top Lokasi (10)</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionBars items={assetsByLocation} emptyTitle="Belum ada lokasi aset." />
          </CardContent>
        </Card>
        <Card className="min-h-[360px]">
          <CardHeader>
            <CardTitle>Top Kategori (10)</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionBars items={assetsByCategory} emptyTitle="Belum ada kategori aset." />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Audit Terakhir</CardTitle>
            <Link href="/dashboard/transactions/audits" className="text-sm text-[var(--primary)] hover:underline">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent>
            <DataTable columns={["Aset", "Status", "Waktu", "Catatan"]} rows={auditRows} emptyTitle="Belum ada data audit." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Disposal Terakhir</CardTitle>
            <Link href="/dashboard/transactions/disposals" className="text-sm text-[var(--primary)] hover:underline">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent>
            <DataTable columns={["Aset", "Alasan", "Waktu", "Status"]} rows={disposalRows} emptyTitle="Belum ada data disposal." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Movement Terakhir</CardTitle>
            <Link href="/dashboard/transactions/movements" className="text-sm text-[var(--primary)] hover:underline">
              Lihat Semua
            </Link>
          </CardHeader>
          <CardContent>
            <DataTable columns={["Aset", "Dari", "Ke", "Status", "Waktu"]} rows={movementRows} emptyTitle="Belum ada data movement." />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Approval Pending (Terbaru)</CardTitle>
            <Link href="/dashboard/approvals" className="text-sm text-[var(--primary)] hover:underline">
              Kelola
            </Link>
          </CardHeader>
          <CardContent>
            <DataTable columns={["Type", "Requester", "Dibuat"]} emptyTitle="Workflow approval belum diaktifkan." />
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 rounded-lg border border-dashed border-[var(--border)] p-5">
        <div className="flex items-center gap-3">
          <Activity className="h-5 w-5 text-[var(--primary)]" />
          <div>
            <p className="font-medium text-[var(--text)]">Dashboard data real-time</p>
            <p className="text-sm text-[var(--muted)]">
              Ringkasan ini membaca data Asset, Movement, Disposal, Audit, Maintenance, dan Warranty langsung dari PostgreSQL melalui Prisma.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
