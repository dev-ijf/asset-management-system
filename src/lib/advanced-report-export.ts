import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import { AuditStatus } from "@/generated/prisma/client";
import { createCsv, formatReportDate, formatReportMoney, parseReportDate } from "@/lib/basic-reports";
import { prisma } from "@/lib/prisma";

export type AdvancedReportFilters = {
  asset?: string;
  category?: string;
  from?: string;
  location?: string;
  status?: string;
  to?: string;
};

type ReportTable = {
  headers: string[];
  name: string;
  rows: string[][];
};

function dateRange(from?: string, to?: string) {
  const gte = parseReportDate(from ?? null);
  const lte = parseReportDate(to ?? null);

  if (!gte && !lte) return undefined;

  return {
    ...(gte ? { gte } : {}),
    ...(lte ? { lte } : {}),
  };
}

function normalizeFilters(searchParams: URLSearchParams): AdvancedReportFilters {
  return {
    asset: searchParams.get("asset") || undefined,
    category: searchParams.get("category") || undefined,
    from: searchParams.get("from") || undefined,
    location: searchParams.get("location") || undefined,
    status: searchParams.get("status") || undefined,
    to: searchParams.get("to") || undefined,
  };
}

export async function buildAdvancedReportTables(searchParams: URLSearchParams) {
  const filters = normalizeFilters(searchParams);
  const createdRange = dateRange(filters.from, filters.to);
  const activityRange = dateRange(filters.from, filters.to);

  const [assets, movements, disposals, audits] = await Promise.all([
    prisma.asset.findMany({
      where: {
        deletedAt: null,
        assetStatusId: filters.status,
        assetCategoryId: filters.category,
        assetLocationId: filters.location,
        createdAt: createdRange,
      },
      include: {
        assetStatus: true,
        assetCategory: true,
        assetClass: true,
        assetLocation: true,
        department: true,
        personInCharge: true,
        assetUser: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.assetMovement.findMany({
      where: {
        assetId: filters.asset,
        performedAt: activityRange,
        OR: filters.location
          ? [
              { fromLocationId: filters.location },
              { toLocationId: filters.location },
            ]
          : undefined,
      },
      include: { asset: true, fromLocation: true, toLocation: true, fromDepartment: true, toDepartment: true, fromAssetUser: true, toAssetUser: true },
      orderBy: { performedAt: "desc" },
    }),
    prisma.assetDisposal.findMany({
      where: {
        assetId: filters.asset,
        disposedAt: activityRange,
        reversedAt: filters.status === "reversed" ? { not: null } : filters.status === "disposed" ? null : undefined,
      },
      include: { asset: true, performedBy: { select: { name: true } }, reversedBy: { select: { name: true } } },
      orderBy: { disposedAt: "desc" },
    }),
    prisma.assetAudit.findMany({
      where: {
        assetId: filters.asset,
        auditedAt: activityRange,
        locationId: filters.location,
        status: filters.status && Object.values(AuditStatus).includes(filters.status as AuditStatus) ? (filters.status as AuditStatus) : undefined,
      },
      include: { asset: true, location: true, auditedBy: { select: { name: true } } },
      orderBy: { auditedAt: "desc" },
    }),
  ]);

  const tables: ReportTable[] = [
    {
      name: "Assets",
      headers: ["Code", "Name", "Status", "Class", "Category", "Location", "Department", "PIC/User", "Cost", "Created At"],
      rows: assets.map((asset) => [
        asset.code,
        asset.name,
        asset.assetStatus?.name ?? "",
        asset.assetClass?.name ?? "",
        asset.assetCategory?.name ?? "",
        asset.assetLocation?.name ?? "",
        asset.department?.name ?? "",
        asset.personInCharge?.name ?? asset.assetUser?.name ?? "",
        formatReportMoney(asset.cost),
        formatReportDate(asset.createdAt),
      ]),
    },
    {
      name: "Movements",
      headers: ["Asset", "From Location", "To Location", "From Department", "To Department", "From User", "To User", "Performed At", "Notes"],
      rows: movements.map((movement) => [
        `${movement.asset.code} - ${movement.asset.name}`,
        movement.fromLocation?.name ?? "",
        movement.toLocation?.name ?? "",
        movement.fromDepartment?.name ?? "",
        movement.toDepartment?.name ?? "",
        movement.fromAssetUser?.name ?? "",
        movement.toAssetUser?.name ?? "",
        formatReportDate(movement.performedAt),
        movement.notes ?? "",
      ]),
    },
    {
      name: "Disposals",
      headers: ["Asset", "Status", "Disposed At", "Reason", "Performed By", "Reversed At", "Reversed By"],
      rows: disposals.map((disposal) => [
        `${disposal.asset.code} - ${disposal.asset.name}`,
        disposal.reversedAt ? "Reversed" : "Disposed",
        formatReportDate(disposal.disposedAt),
        disposal.reason,
        disposal.performedBy?.name ?? "",
        disposal.reversedAt ? formatReportDate(disposal.reversedAt) : "",
        disposal.reversedBy?.name ?? "",
      ]),
    },
    {
      name: "Audits",
      headers: ["Asset", "Status", "Location", "Audited At", "Auditor", "Notes"],
      rows: audits.map((audit) => [
        `${audit.asset.code} - ${audit.asset.name}`,
        audit.status,
        audit.location?.name ?? "",
        formatReportDate(audit.auditedAt),
        audit.auditedBy?.name ?? "",
        audit.notes ?? "",
      ]),
    },
  ];

  return tables;
}

export function buildExcelBuffer(tables: ReportTable[]) {
  const workbook = XLSX.utils.book_new();

  for (const table of tables) {
    const sheet = XLSX.utils.aoa_to_sheet([table.headers, ...table.rows]);
    XLSX.utils.book_append_sheet(workbook, sheet, table.name.slice(0, 31));
  }

  return XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
}

export async function buildPdfBuffer(tables: ReportTable[]) {
  const doc = new PDFDocument({ layout: "landscape", margin: 32, size: "A4" });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  doc.fontSize(16).text("Asset Management Reports", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor("#4b587c").text(`Generated at ${new Date().toLocaleString("id-ID")}`);
  doc.moveDown();

  for (const [index, table] of tables.entries()) {
    if (index > 0) doc.addPage({ layout: "landscape", margin: 32, size: "A4" });

    doc.fillColor("#001f4f").fontSize(13).text(table.name);
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor("#001f4f").text(table.headers.join(" | "));
    doc.moveDown(0.25);
    doc.moveTo(doc.x, doc.y).lineTo(780, doc.y).strokeColor("#dfe7f3").stroke();
    doc.moveDown(0.4);

    const rows = table.rows.slice(0, 35);
    for (const row of rows) {
      doc.fillColor("#001f4f").fontSize(7).text(row.map((cell) => String(cell).replace(/\s+/g, " ")).join(" | "), {
        lineGap: 2,
      });
      doc.moveDown(0.2);
    }

    if (table.rows.length > rows.length) {
      doc.moveDown(0.5);
      doc.fillColor("#4b587c").fontSize(8).text(`Showing first ${rows.length} of ${table.rows.length} rows.`);
    }
  }

  doc.end();

  return new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

export function buildCsvFromTable(table: ReportTable) {
  return createCsv(table.headers, table.rows);
}
