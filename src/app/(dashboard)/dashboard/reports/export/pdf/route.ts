import { NextRequest } from "next/server";
import { buildAdvancedReportTables, buildPdfBuffer } from "@/lib/advanced-report-export";
import { ensureReportsViewForExport } from "@/lib/basic-reports";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const tables = await buildAdvancedReportTables(request.nextUrl.searchParams);
  const buffer = await buildPdfBuffer(tables);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": 'attachment; filename="asset-management-reports.pdf"',
      "Content-Type": "application/pdf",
    },
  });
}
