import { NextRequest } from "next/server";
import { createCsv, csvResponse, ensureReportsViewForExport, formatReportDate, getParam, parseReportDate } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const searchParams = request.nextUrl.searchParams;
  const from = parseReportDate(getParam(searchParams, "from"));
  const to = parseReportDate(getParam(searchParams, "to"));
  const status = getParam(searchParams, "status");
  const disposals = await prisma.assetDisposal.findMany({
    where: {
      assetId: getParam(searchParams, "asset") || undefined,
      disposedAt: from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined,
      reversedAt: status === "reversed" ? { not: null } : status === "disposed" ? null : undefined,
    },
    include: { asset: true, performedBy: { select: { name: true } }, reversedBy: { select: { name: true } } },
    orderBy: { disposedAt: "desc" },
  });

  const csv = createCsv(
    ["Asset Code", "Asset Name", "Status", "Disposed At", "Reason", "Performed By", "Reversed At", "Reversed By"],
    disposals.map((disposal) => [
      disposal.asset.code,
      disposal.asset.name,
      disposal.reversedAt ? "Reversed" : "Disposed",
      formatReportDate(disposal.disposedAt),
      disposal.reason,
      disposal.performedBy?.name,
      disposal.reversedAt ? formatReportDate(disposal.reversedAt) : "",
      disposal.reversedBy?.name,
    ]),
  );

  return csvResponse("disposals-report.csv", csv);
}
