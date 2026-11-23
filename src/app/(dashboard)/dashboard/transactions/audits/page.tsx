import { AuditForm } from "@/components/transactions/transaction-forms";
import type { Prisma } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/tables/pagination";
import { formatDate, getTransactionOptions, requireAnyPermission } from "@/lib/asset-transaction-view";
import { prisma } from "@/lib/prisma";
import { paginate } from "@/lib/pagination";

import { FilterField, FilterPanel } from "@/components/tables/filter-panel";
import { DateRangeAlert, DateRangeInputs } from "@/components/ui/date-range-inputs";
import { parseDateRange } from "@/lib/date-range";
import { Select } from "@/components/ui/select";
const AUDIT_STATUSES = ["MATCHED", "MISSING", "DAMAGED", "MATCH", "MISMATCH"] as const;
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ q?: string; page?: string; limit?: string; from?: string; to?: string; status?: string }>;
};

export default async function AuditsPage({ searchParams }: PageProps) {
  await requireAnyPermission(["reports.view", "audits.manage"]);
  const params = await searchParams;
  const { q = "" } = params;
  const options = await getTransactionOptions();

  const range = parseDateRange(params.from, params.to);
  const where: Prisma.AssetAuditWhereInput = {
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
      status: AUDIT_STATUSES.includes(params.status as (typeof AUDIT_STATUSES)[number]) ? (params.status as (typeof AUDIT_STATUSES)[number]) : undefined,
    };
  const activeFilters = [params.status, params.from, params.to].filter(Boolean).length;
  const { items: audits, pagination } = await paginate(params,
    () => prisma.assetAudit.count({ where }),
    ({ skip, take }) => prisma.assetAudit.findMany({ where, skip, take, include: {
      asset: true,
      location: true,
      auditedBy: { select: { name: true } },
    }, orderBy: { createdAt: "desc" } }),
  );

  return (
    <>
      <PageHeader title="Audit Aset" subtitle="Catat hasil audit fisik asset." />
      <div className="space-y-5">
        <AuditForm assets={options.assets} locations={options.locations} />
        <Card>
          <CardContent className="space-y-4">
            <form>
              <input type="hidden" name="limit" value={pagination.pageSize} />
              <FilterPanel
                searchValue={q}
                searchPlaceholder="Cari code atau name asset"
                activeCount={activeFilters}
                resetHref={q ? `/dashboard/transactions/audits?q=${encodeURIComponent(q)}` : "/dashboard/transactions/audits"}
              >
                <FilterField label="Status">
                  <Select name="status" defaultValue={params.status ?? ""}>
                    <option value="">Semua status</option>
                    {AUDIT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </Select>
                </FilterField>
                <DateRangeInputs from={params.from} to={params.to} labelled />
              </FilterPanel>
            </form>
            <DateRangeAlert message={range.error} />
            {audits.length === 0 ? (
              <EmptyState title="Belum ada data audit." description="Audit yang dibuat akan tampil di sini." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-xs">
                  <thead className="whitespace-nowrap bg-[var(--table-head)] text-xs uppercase text-[var(--muted)]">
                    <tr>
                      <th className="px-3 py-2">No</th>
                      <th className="px-3 py-2">Asset</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2">Audited At</th>
                      <th className="px-3 py-2">Auditor</th>
                      <th className="px-3 py-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {audits.map((audit, index) => (
                      <tr key={audit.id}>
                        <td className="px-3 py-2">{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                        <td className="px-3 py-2 font-medium">{audit.asset.code} - {audit.asset.name}</td>
                        <td className="px-3 py-2"><Badge variant={audit.status === "MISSING" || audit.status === "DAMAGED" ? "danger" : "success"}>{audit.status}</Badge></td>
                        <td className="px-3 py-2">{audit.location ? `${audit.location.code} - ${audit.location.name}` : "-"}</td>
                        <td className="px-3 py-2">{formatDate(audit.auditedAt)}</td>
                        <td className="px-3 py-2">{audit.auditedBy?.name ?? "-"}</td>
                        <td className="px-3 py-2">{audit.notes ?? "-"}</td>
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
