import { BatchQrLabels } from "@/components/assets/batch-qr-labels";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { requireReportsView } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function QrLabelsPage() {
  await requireReportsView();

  const assets = await prisma.asset.findMany({
    where: { deletedAt: null },
    orderBy: { code: "asc" },
    select: { code: true, name: true, qrToken: true },
  });

  return (
    <>
      <PageHeader title="Batch QR Labels" subtitle="Cetak label QR asset secara massal dari qrToken yang sudah tersimpan." />
      {assets.length === 0 ? (
        <EmptyState title="Belum ada asset." description="Label QR akan tampil setelah asset tersedia." />
      ) : (
        <BatchQrLabels assets={assets} />
      )}
    </>
  );
}
