import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { formatDateTime } from "@/lib/asset-transaction-view";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AssetHistoryPage({ params }: PageProps) {
  await requirePermission("assets.view");
  const { id } = await params;

  const asset = await prisma.asset.findUnique({
    where: { id },
    select: {
      code: true,
      id: true,
      name: true,
      histories: {
        orderBy: { createdAt: "desc" },
        include: {
          changedBy: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!asset) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title="Riwayat Aset"
        subtitle={`${asset.code} - ${asset.name}`}
        actions={
          <Link
            href={`/dashboard/assets/${asset.id}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-white px-5 text-sm font-medium text-[var(--text)] transition hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Timeline History</CardTitle>
        </CardHeader>
        <CardContent>
          {asset.histories.length === 0 ? (
            <EmptyState title="Belum ada riwayat." description="Aktivitas asset akan tercatat di sini." />
          ) : (
            <div className="space-y-4">
              {asset.histories.map((history) => (
                <div key={history.id} className="border-l-2 border-[var(--primary-soft)] pl-4">
                  <div className="rounded-md border border-[var(--border)] bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text)]">{history.action}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">{history.description ?? "-"}</p>
                      </div>
                      <p className="text-xs font-medium text-[var(--muted)]">{formatDateTime(history.createdAt)}</p>
                    </div>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      User: {history.changedBy ? `${history.changedBy.name} (${history.changedBy.email})` : "-"}
                    </p>
                    {history.payload ? (
                      <pre className="mt-3 max-h-40 overflow-auto rounded-md bg-slate-50 p-3 text-xs text-[var(--muted)]">
                        {JSON.stringify(history.payload, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
