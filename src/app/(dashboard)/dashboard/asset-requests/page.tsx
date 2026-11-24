import { AssetRequestStatus, type Prisma } from "@/generated/prisma/client";
import { AssetRequestActions, AssetRequestCreateButton } from "@/components/class/class-forms";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/tables/data-table";
import { FilterField, FilterPanel } from "@/components/tables/filter-panel";
import { Pagination } from "@/components/tables/pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { requireAnyPermission } from "@/lib/asset-transaction-view";
import { hasPermission } from "@/lib/auth";
import { CLASS_PERMISSIONS } from "@/lib/class-scope";
import { wibFormat } from "@/lib/datetime";
import { buildLocationTree } from "@/lib/location-tree";
import { paginate } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; limit?: string; status?: string }>;
};

const STATUS_LABELS: Record<AssetRequestStatus, { label: string; variant: "warning" | "info" | "danger" | "success" | "default" }> = {
  PENDING: { label: "Menunggu", variant: "warning" },
  APPROVED: { label: "Disetujui", variant: "info" },
  REJECTED: { label: "Ditolak", variant: "danger" },
  FULFILLED: { label: "Sudah diproses", variant: "success" },
  CANCELLED: { label: "Dibatalkan", variant: "default" },
};

const time = wibFormat({ day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function AssetRequestsPage({ searchParams }: PageProps) {
  const user = await requireAnyPermission([CLASS_PERMISSIONS.requestAsset, "approvals.manage", "assets.manage"]);
  const params = await searchParams;
  const canReview = hasPermission(user, "approvals.manage");
  const canFulfill = hasPermission(user, "assets.manage");
  const seesAll = canReview || canFulfill;
  const canCreate = hasPermission(user, CLASS_PERMISSIONS.requestAsset);
  const status = params.status && params.status in AssetRequestStatus ? (params.status as AssetRequestStatus) : undefined;
  const q = params.q?.trim() ?? "";

  const where: Prisma.AssetRequestWhereInput = {
    AND: [
      seesAll ? {} : { requesterId: user.id },
      status ? { status } : {},
      q
        ? {
            OR: [
              { itemName: { contains: q, mode: "insensitive" } },
              { requester: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {},
    ],
  };

  const [{ items: requests, pagination }, locations] = await Promise.all([
    paginate(params, () => prisma.assetRequest.count({ where }), ({ skip, take }) =>
      prisma.assetRequest.findMany({
        where,
        skip,
        take,
        // Waiting requests first, then newest.
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        include: {
          requester: { select: { name: true } },
          reviewedBy: { select: { name: true } },
          fulfilledBy: { select: { name: true } },
          fulfilledAsset: { select: { code: true } },
        },
      }),
    ),
    prisma.assetLocation.findMany({ select: { id: true, code: true, name: true, parentId: true } }),
  ]);
  const locationPath = new Map(buildLocationTree(locations).map((item) => [item.id, item.path]));

  return (
    <>
      <PageHeader
        title="Pengajuan Asset Baru"
        subtitle={
          seesAll
            ? "Pengajuan barang baru dari kelas. Setujui atau tolak, lalu tandai sudah diproses setelah barang dibeli dan didaftarkan sebagai asset."
            : "Pengajuan barang baru untuk kelas Anda beserta statusnya."
        }
        actions={canCreate ? <AssetRequestCreateButton /> : null}
      />
      <Card>
        <CardContent className="space-y-4">
          <form>
            <input type="hidden" name="limit" value={pagination.pageSize} />
            <FilterPanel
              searchValue={q}
              searchPlaceholder={seesAll ? "Cari nama barang atau pengaju" : "Cari nama barang"}
              activeCount={status ? 1 : 0}
              resetHref={q ? `/dashboard/asset-requests?q=${encodeURIComponent(q)}` : "/dashboard/asset-requests"}
            >
              <FilterField label="Status">
                <Select name="status" defaultValue={status ?? ""}>
                  <option value="">Semua status</option>
                  {Object.entries(STATUS_LABELS).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </FilterField>
            </FilterPanel>
          </form>
          <DataTable
            columns={["Diajukan", "Barang", "Jumlah", "Kelas", ...(seesAll ? ["Pengaju"] : []), "Alasan", "Status", "Keterangan", "Action"]}
            rows={requests.map((request) => {
              const badge = STATUS_LABELS[request.status];
              const note =
                request.status === "REJECTED"
                  ? `${request.rejectNote ?? "-"} (oleh ${request.reviewedBy?.name ?? "-"})`
                  : request.status === "FULFILLED"
                    ? [request.fulfilledAsset ? `Asset ${request.fulfilledAsset.code}` : null, request.fulfilledNote, `oleh ${request.fulfilledBy?.name ?? "-"}`]
                        .filter(Boolean)
                        .join(" · ")
                    : request.status === "APPROVED"
                      ? `Disetujui ${request.reviewedBy?.name ?? "-"}${request.reviewedAt ? `, ${time.format(request.reviewedAt)}` : ""}`
                      : "-";
              return [
                time.format(request.createdAt),
                <span key="item" className="font-medium">
                  {request.itemName}
                  {request.notes ? <span className="block font-normal text-[var(--muted)]">{request.notes}</span> : null}
                </span>,
                request.quantity,
                request.assetLocationId ? locationPath.get(request.assetLocationId) ?? "-" : "-",
                ...(seesAll ? [request.requester?.name ?? "-"] : []),
                request.reason,
                <Badge key="status" variant={badge.variant}>{badge.label}</Badge>,
                note,
                <AssetRequestActions
                  key="actions"
                  id={request.id}
                  label={`${request.itemName} (${request.quantity})`}
                  status={request.status}
                  isOwner={request.requesterId === user.id}
                  canReview={canReview}
                  canFulfill={canFulfill}
                />,
              ];
            })}
            emptyTitle="Belum ada pengajuan asset."
          />
          <Pagination {...pagination} />
        </CardContent>
      </Card>
    </>
  );
}
