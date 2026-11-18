import { NextRequest } from "next/server";
import { buildAdvancedReportTables, buildPdfBuffer } from "@/lib/advanced-report-export";
import { ensureReportsViewForExport } from "@/lib/basic-reports";
import { dateRangeErrorResponse, parseDateRange } from "@/lib/date-range";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const { searchParams } = request.nextUrl;
  if (parseDateRange(searchParams.get("from"), searchParams.get("to")).error) return dateRangeErrorResponse();

  const tables = await buildAdvancedReportTables(searchParams);
  const buffer = await buildPdfBuffer(tables);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": 'attachment; filename="asset-management-reports.pdf"',
      "Content-Type": "application/pdf",
    },
  });
}
