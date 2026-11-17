import Link from "next/link";
import { Eye, Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { ArchiveTable } from "@/components/assets/archive-table-client";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/tables/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { hasPermission, requirePermission } from "@/lib/auth";
import { createPagination, paginationQuery, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const value = (input: string | string[] | undefined) => String(Array.isArray(input) ? input[0] ?? "" : input ?? "").trim();
const dateTime = (date: Date | null) => date ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date) : "-";

export default async function ArchivePage({ searchParams }: Props) {
  const user = await requirePermission("assets.view");
  const canManage = hasPermission(user, "assets.manage");
  const params = await searchParams;
  const q = value(params.q), category = value(params.category), location = value(params.location), department = value(params.department);
  const age = value(params.age), sort = value(params.sort) || "archivedAt", direction = value(params.direction) === "asc" ? "asc" : "desc";
  const fromRaw = value(params.from), toRaw = value(params.to);
  const { page: requestedPage, pageSize } = parsePagination(params);
  const now = new Date();
  const ageDate = (days: number) => new Date(now.getTime() - days * 86400000);
  const archivedAt: Prisma.DateTimeNullableFilter = {};
  if (fromRaw && !Number.isNaN(Date.parse(fromRaw))) archivedAt.gte = new Date(`${fromRaw}T00:00:00`);
  if (toRaw && !Number.isNaN(Date.parse(toRaw))) archivedAt.lte = new Date(`${toRaw}T23:59:59.999`);
  if (age === "30") archivedAt.gte = ageDate(30);
  if (age === "90") { archivedAt.gte = ageDate(90); archivedAt.lt = ageDate(30); }
  if (age === "180") { archivedAt.gte = ageDate(180); archivedAt.lt = ageDate(90); }
  if (age === "365") { archivedAt.gte = ageDate(365); archivedAt.lt = ageDate(180); }
  if (age === "older") archivedAt.lt = ageDate(365);
  const where: Prisma.AssetWhereInput = { deletedAt: null, archivedAt: { not: null, ...archivedAt }, assetCategoryId: category || undefined, assetLocationId: location || undefined, departmentId: department || undefined, ...(q ? { OR: [{ code: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }, { serialNumber: { contains: q, mode: "insensitive" } }, { archiveReason: { contains: q, mode: "insensitive" } }] } : {}) };
  const [total, categories, locations, departments] = await Promise.all([prisma.asset.count({ where }), prisma.assetCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }), prisma.assetLocation.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }), prisma.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })]);
  const pagination = createPagination(total, requestedPage, pageSize);
  const orderBy: Prisma.AssetOrderByWithRelationInput = sort === "code" ? { code: direction } : sort === "name" ? { name: direction } : { archivedAt: direction };
  const assets = await prisma.asset.findMany({ where, ...paginationQuery(pagination), orderBy, include: { assetCategory: true, assetLocation: true, department: true, assetStatus: true, archivedBy: { select: { name: true } } } });
  const exportQuery = new URLSearchParams();
  for (const [key, item] of Object.entries(params)) if (item) exportQuery.set(key, value(item));

  return <>
    <PageHeader title="Archive" subtitle="Aset nonaktif yang dapat dipulihkan tanpa kehilangan data, foto, atau riwayat." actions={<Link href={`/dashboard/archive/export?${exportQuery}`} className="inline-flex h-10 items-center rounded-md border border-[var(--border)] bg-white px-5 text-sm font-medium hover:bg-slate-50">Export</Link>} />
    <Card><CardHeader className="space-y-4"><CardTitle>Daftar Aset Arsip</CardTitle><form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><input type="hidden" name="limit" value={pagination.pageSize} /><div className="relative"><Input name="q" defaultValue={q} placeholder="Cari code, name, serial, alasan" className="pr-10" /><Search className="absolute right-3 top-3.5 h-4 w-4 text-[var(--muted)]" /></div><Select name="category" defaultValue={category}><option value="">Semua kategori</option>{categories.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select><Select name="location" defaultValue={location}><option value="">Semua lokasi</option>{locations.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select><Select name="department" defaultValue={department}><option value="">Semua departemen</option>{departments.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select><Select name="age" defaultValue={age}><option value="">Semua usia arsip</option><option value="30">0–30 hari</option><option value="90">31–90 hari</option><option value="180">91–180 hari</option><option value="365">181–365 hari</option><option value="older">Lebih dari 1 tahun</option></Select><Input type="date" name="from" defaultValue={fromRaw} aria-label="Tanggal arsip mulai" /><Input type="date" name="to" defaultValue={toRaw} aria-label="Tanggal arsip akhir" /><div className="flex gap-2"><Select name="sort" defaultValue={sort}><option value="archivedAt">Tanggal arsip</option><option value="code">Kode</option><option value="name">Nama</option></Select><Select name="direction" defaultValue={direction}><option value="desc">Turun</option><option value="asc">Naik</option></Select><button className="rounded-md bg-[var(--primary)] px-4 text-sm font-medium text-white">Filter</button></div></form></CardHeader>
      <CardContent>{assets.length ? <ArchiveTable canManage={canManage} ids={assets.map((x) => x.id)} codes={assets.map((x) => x.code)} columns={["Kode", "Nama", "Kategori", "Lokasi", "Departemen", "Status", "Diarsipkan", "Oleh", "Alasan", "Detail"]} rows={assets.map((asset) => [<strong key="code">{asset.code}</strong>, <span key="name">{asset.name}</span>, asset.assetCategory?.name ?? "-", asset.assetLocation?.name ?? "-", asset.department?.name ?? "-", asset.assetStatus ? <Badge key="status">{asset.assetStatus.name}</Badge> : "-", dateTime(asset.archivedAt), asset.archivedBy?.name ?? "-", asset.archiveReason ?? "-", <Link key="detail" href={`/dashboard/assets/${asset.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary)] hover:underline"><Eye className="h-4 w-4" />Detail</Link>])} /> : <EmptyState title="Belum ada aset yang diarsipkan." description="Aset yang diarsipkan dari daftar aktif akan muncul di sini." />}<div className="mt-4"><Pagination {...pagination} /></div></CardContent>
    </Card>
  </>;
}
