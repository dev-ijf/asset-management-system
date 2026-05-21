import { NextResponse } from "next/server";
import { hasPermission, getCurrentUser, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function formatReportDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatReportMoney(value: unknown) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(Number(value));
}

export function parseReportDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key)?.trim() ?? "";
}

export async function requireReportsView() {
  return requirePermission("reports.view");
}

export async function ensureReportsViewForExport() {
  const user = await getCurrentUser();

  if (!hasPermission(user, "reports.view")) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return null;
}

export async function getReportOptions() {
  const [assets, statuses, classes, categories, locations, departments] = await Promise.all([
    prisma.asset.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.assetStatus.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.assetClass.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.assetCategory.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.assetLocation.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.department.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
  ]);

  const coded = (items: { code: string; id: string; name: string }[]) => items.map((item) => ({ id: item.id, label: `${item.code} - ${item.name}` }));

  return {
    assets: assets.map((asset) => ({ id: asset.id, label: `${asset.code} - ${asset.name}` })),
    categories: coded(categories),
    classes: coded(classes),
    departments: coded(departments),
    locations: coded(locations),
    statuses: coded(statuses),
  };
}

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function createCsv(headers: string[], rows: unknown[][]) {
  return [headers.map(csvCell).join(","), ...rows.map((row) => row.map(csvCell).join(","))].join("\r\n");
}

export function csvResponse(filename: string, csv: string) {
  return new Response(csv, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "text/csv; charset=utf-8",
    },
  });
}
