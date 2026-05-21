import { NextRequest } from "next/server";
import { AuditStatus } from "@/generated/prisma/client";
import { createCsv, csvResponse, ensureReportsViewForExport, formatReportDate, getParam, parseReportDate } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const searchParams = request.nextUrl.searchParams;
  const from = parseReportDate(getParam(searchParams, "from"));
  const to = parseReportDate(getParam(searchParams, "to"));
  const status = getParam(searchParams, "status");
  const audits = await prisma.assetAudit.findMany({
    where: {
      assetId: getParam(searchParams, "asset") || undefined,
      status: status ? (status as AuditStatus) : undefined,
      auditedAt: from || to ? { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } : undefined,
    },
    include: { asset: true, location: true, auditedBy: { select: { name: true } } },
    orderBy: { auditedAt: "desc" },
  });

  const csv = createCsv(
    ["Asset Code", "Asset Name", "Status", "Location", "Audited At", "Auditor", "Notes"],
    audits.map((audit) => [
      audit.asset.code,
      audit.asset.name,
      audit.status,
      audit.location?.name,
      formatReportDate(audit.auditedAt),
      audit.auditedBy?.name,
      audit.notes,
    ]),
  );

  return csvResponse("audits-report.csv", csv);
}
