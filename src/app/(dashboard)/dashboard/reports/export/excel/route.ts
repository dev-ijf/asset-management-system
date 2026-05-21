import { NextRequest } from "next/server";
import { buildAdvancedReportTables, buildExcelBuffer } from "@/lib/advanced-report-export";
import { ensureReportsViewForExport } from "@/lib/basic-reports";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const forbidden = await ensureReportsViewForExport();
  if (forbidden) return forbidden;

  const tables = await buildAdvancedReportTables(request.nextUrl.searchParams);
  const buffer = buildExcelBuffer(tables);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Disposition": 'attachment; filename="asset-management-reports.xlsx"',
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  });
}
