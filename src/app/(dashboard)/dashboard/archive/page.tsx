import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { ArchiveTable } from "@/components/assets/archive-table-client";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/tables/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buildArchiveQuery, type ArchiveView } from "@/lib/archive-query";
import { DateRangeAlert, DateRangeInputs } from "@/components/ui/date-range-inputs";
import { hasPermission, requirePermission } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { createPagination, paginationQuery, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { wibFormat } from "@/lib/datetime";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (input: string | string[] | undefined) => String(Array.isArray(input) ? input[0] ?? "" : input ?? "").trim();
const dateTime = (date: Date | null) =>
  date ? wibFormat({ day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date) : "-";

const VIEWS: Record<ArchiveView, { label: string; dateLabel: string; byLabel: string; empty: string; emptyDescription: string }> = {
  archived: {
    label: "Diarsipkan",
    dateLabel: "Diarsipkan",
    byLabel: "Oleh",
    empty: "Belum ada aset yang diarsipkan.",
    emptyDescription: "Aset yang diarsipkan dari daftar aktif akan muncul di sini.",
  },
  deleted: {
    label: "Dihapus",
    dateLabel: "Dihapus",
    byLabel: "Dihapus oleh",
    empty: "Belum ada aset yang dihapus.",
    emptyDescription: "Aset yang dihapus dari daftar aktif akan muncul di sini sampai dipulihkan atau dihapus permanen.",
  },
};

export default async function ArchivePage({ searchParams }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const params = await searchParams;
  const flat = new URLSearchParams();
  for (const [key, item] of Object.entries(params)) if (item) flat.set(key, first(item));

  const { view, where, orderBy, values, dateError } = buildArchiveQuery(flat);
  const config = VIEWS[view];
  const { page: requestedPage, pageSize } = parsePagination(params);

  const [total, archivedCount, deletedCount, categories, locations, departments] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.count({ where: { deletedAt: null, archivedAt: { not: null } } }),
    prisma.asset.count({ where: { deletedAt: { not: null } } }),
    prisma.assetCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.assetLocation.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const pagination = createPagination(total, requestedPage, pageSize);
  const assets = await prisma.asset.findMany({
    where,
    orderBy,
    ...paginationQuery(pagination),
    include: {
      assetCategory: { select: { name: true } },
      assetLocation: { select: { name: true } },
      department: { select: { name: true } },
      assetStatus: { select: { name: true } },
      archivedBy: { select: { name: true } },
      // Soft delete does not store who deleted; the DELETED history row does.
      histories: {
        where: { action: "DELETED" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { changedBy: { select: { name: true } } },
      },
    },
  });

  const exportQuery = new URLSearchParams(flat);
  exportQuery.set("view", view);
  const tabHref = (target: ArchiveView) => `/dashboard/archive?view=${target}&limit=${pagination.pageSize}`;
  const counts: Record<ArchiveView, number> = { archived: archivedCount, deleted: deletedCount };

  return (
    <>
      <PageHeader
        title="Archive"
        subtitle="Aset yang diarsipkan atau dihapus. Pulihkan ke daftar aktif, atau hapus permanen agar master data yang dipakainya bisa dihapus."
        actions={
          <Link
            href={`/dashboard/archive/export?${exportQuery}`}
            className="inline-flex h-10 items-center rounded-md border border-[var(--border)] bg-white px-5 text-sm font-medium hover:bg-slate-50"
          >
            Export
          </Link>
        }
      />
      <Card>
        <CardHeader className="space-y-4">
          <nav className="flex gap-2 border-b border-[var(--border)]" aria-label="Jenis arsip">
            {(Object.keys(VIEWS) as ArchiveView[]).map((target) => (
              <Link
                key={target}
                href={tabHref(target)}
                aria-current={view === target ? "page" : undefined}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
                  view === target
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-[var(--muted)] hover:text-[var(--text)]",
                )}
              >
                {VIEWS[target].label} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{counts[target]}</span>
              </Link>
            ))}
          </nav>
          <CardTitle>{view === "deleted" ? "Daftar Aset Terhapus" : "Daftar Aset Arsip"}</CardTitle>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input type="hidden" name="view" value={view} />
            <input type="hidden" name="limit" value={pagination.pageSize} />
            <div className="relative">
              <Input name="q" defaultValue={values.q} placeholder="Cari code, name, serial, alasan" className="pr-10" />
              <Search className="absolute right-3 top-3.5 h-4 w-4 text-[var(--muted)]" />
            </div>
            <Select name="category" defaultValue={flat.get("category") ?? ""}>
              <option value="">Semua kategori</option>
              {categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
            <Select name="location" defaultValue={flat.get("location") ?? ""}>
              <option value="">Semua lokasi</option>
              {locations.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
            <Select name="department" defaultValue={flat.get("department") ?? ""}>
              <option value="">Semua departemen</option>
              {departments.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </Select>
            <Select name="age" defaultValue={values.age}>
              <option value="">{view === "deleted" ? "Semua usia hapus" : "Semua usia arsip"}</option>
              <option value="30">0–30 hari</option>
              <option value="90">31–90 hari</option>
              <option value="180">91–180 hari</option>
              <option value="365">181–365 hari</option>
              <option value="older">Lebih dari 1 tahun</option>
            </Select>
            <DateRangeInputs from={values.from} to={values.to} />
            <div className="flex gap-2">
              <Select name="sort" defaultValue={values.sort}>
                <option value="date">{view === "deleted" ? "Tanggal hapus" : "Tanggal arsip"}</option>
                <option value="code">Kode</option>
                <option value="name">Nama</option>
              </Select>
              <Select name="direction" defaultValue={values.direction}>
                <option value="desc">Turun</option>
                <option value="asc">Naik</option>
              </Select>
              <button className="rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white">Filter</button>
            </div>
          </form>
        </CardHeader>
        <CardContent>
          {dateError ? (
            <DateRangeAlert message={dateError} />
          ) : assets.length ? (
            <ArchiveTable
              key={view}
              canManage={canManage}
              ids={assets.map((x) => x.id)}
              codes={assets.map((x) => x.code)}
              columns={["Kode", "Nama", "Kategori", "Lokasi", "Departemen", "Status", config.dateLabel, config.byLabel, "Alasan arsip", "Detail"]}
              rows={assets.map((asset) => [
                <strong key="code">{asset.code}</strong>,
                <span key="name">{asset.name}</span>,
                asset.assetCategory?.name ?? "-",
                asset.assetLocation?.name ?? "-",
                asset.department?.name ?? "-",
                asset.assetStatus ? <Badge key="status">{asset.assetStatus.name}</Badge> : "-",
                dateTime(view === "deleted" ? asset.deletedAt : asset.archivedAt),
                (view === "deleted" ? asset.histories[0]?.changedBy?.name : asset.archivedBy?.name) ?? "-",
                asset.archiveReason ?? "-",
                <Link
                  key="detail"
                  href={`/dashboard/assets/${asset.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  <Eye className="h-4 w-4" />
                  Detail
                </Link>,
              ])}
            />
          ) : (
            <EmptyState title={config.empty} description={config.emptyDescription} />
          )}
          <div className="mt-4">
            <Pagination {...pagination} />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
