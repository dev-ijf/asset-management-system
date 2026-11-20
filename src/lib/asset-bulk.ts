import { randomUUID } from "node:crypto";
import { Prisma, type Asset } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { DISPOSED_STATUS_CODE, statusChangeError } from "@/lib/asset-disposal";
import { createAssetHistory } from "@/lib/asset-history";
import { masterTemplateBuffer } from "@/lib/asset-bulk-template";
import { categoryClassResolver } from "@/lib/category-class";
import { warrantyEndDate } from "@/lib/warranty";
import {
  CAPEX_OPEX_CHOICES, DEPRECIATION_CHOICES, importColumns, parseYesNo, updateColumns, YES_NO_CHOICES,
  MAX_BULK_ROWS, type BulkMode, type BulkRow, type BulkPreview, workbookBuffer,
} from "@/lib/asset-bulk-format";
import type { CapexOpex, DepreciationMethod } from "@/generated/prisma/client";

type DB = Prisma.TransactionClient;
const relations = {
  Category: "assetCategoryId", Class: "assetClassId", Status: "assetStatusId", Location: "assetLocationId",
  Department: "departmentId", "Asset User": "assetUserId", PIC: "personInChargeId",
  Unit: "unitId", Warranty: "warrantyId", "Vendor Contract": "vendorContractId",
} as const;
type Option = { id: string; name: string; code?: string; parentId?: string | null; assetClassId?: string | null; durationMonths?: number };
type Catalog = Record<keyof typeof relations, Option[]>;
async function catalog(db: DB): Promise<Catalog> {
  const [Category, Class, Status, Location, Department, users, PIC, units, warranties, contracts] = await Promise.all([
    db.assetCategory.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }), db.assetClass.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }), db.assetStatus.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }), db.assetLocation.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
    db.department.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }), db.assetUser.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }), db.personInCharge.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
    db.unit.findMany({ orderBy: [{ symbol: "asc" }, { id: "asc" }] }),
    db.warranty.findMany({ orderBy: [{ name: "asc" }, { id: "asc" }] }),
    db.vendorContract.findMany({ orderBy: [{ vendorName: "asc" }, { id: "asc" }] }),
  ]);
  return {
    Category, Class, Status, Location, Department, "Asset User": users, PIC,
    // Same labels as the asset form dropdowns; symbol / contract number keep them unambiguous.
    Unit: units.map((unit) => ({ id: unit.id, name: `${unit.symbol} - ${unit.name}` })),
    Warranty: warranties.map((warranty) => ({ id: warranty.id, name: warranty.name, durationMonths: warranty.durationMonths })),
    "Vendor Contract": contracts.map((contract) => ({
      id: contract.id,
      name: contract.contractNumber ? `${contract.vendorName} - ${contract.contractNumber}` : contract.vendorName,
    })),
  };
}
function resolveOption(options: Option[], value: string, label: string) {
  if (!value) return null;
  const named = options.filter(o => o.name === value);
  if (!named.length) throw new Error(`${label} '${value}' does not exist in master data.`);
  if (named.length > 1) throw new Error(`${label} '${value}' is ambiguous in master data. Hubungi administrator untuk membedakan nama master.`);
  return named[0].id;
}
/**
 * A category paired with a class decides the class (see lib/category-class): an empty Class cell is
 * filled with it, a different one is rejected. Runs before changes are listed, so the preview is exact.
 */
function fillCategoryClass(row: BulkRow, options: Catalog) {
  const categoryName = row.values.Category;
  if (!categoryName) return;
  const categoryId = resolveOption(options.Category, categoryName, "Category");
  const classOf = categoryClassResolver(
    options.Category.map((category) => ({ id: category.id, parentId: category.parentId ?? null, assetClassId: category.assetClassId ?? null })),
  );
  const classId = classOf(categoryId);
  const className = classId ? options.Class.find((option) => option.id === classId)?.name : undefined;
  if (!classId || !className) return;
  if (!row.values.Class) {
    row.values.Class = className;
    return;
  }
  if (resolveOption(options.Class, row.values.Class, "Class") !== classId) {
    throw new Error(`Class '${row.values.Class}' tidak sesuai kategori '${categoryName}', yang memakai class '${className}'. Kosongkan kolom Class atau isi '${className}'.`);
  }
}
function assetData(row: BulkRow, options: Catalog, mode: BulkMode) {
  const data: Omit<Prisma.AssetUncheckedCreateInput, "code" | "qrToken"> = { name: row.name };
  for (const [label, field] of Object.entries(relations)) {
    if (label in row.values) data[field as typeof relations[keyof typeof relations]] = resolveOption(options[label as keyof Catalog], row.values[label], label);
  }
  if ("Description" in row.values) data.description = row.values.Description || null;
  if (mode === "IMPORT") {
    data.serialNumber = row.values["Serial Number"] || null;
    data.cost = row.values.Cost || null;
    data.purchaseDate = row.values["Purchase Date"] ? new Date(`${row.values["Purchase Date"]}T00:00:00Z`) : null;
    data.assetStatusId ??= options.Status.find(o => o.code === "ACTIVE")?.id ?? null;
    const v = row.values;
    const warranty = options.Warranty.find(o => o.id === data.warrantyId);
    data.warrantyEnd = warrantyEndDate(data.purchaseDate as Date | null, warranty?.durationMonths);
    data.residualValue = v["Residual Value"] || null;
    data.usefulLifeMonths = v["Useful Life (Months)"] ? Number(v["Useful Life (Months)"]) : null;
    data.depreciationMethod = (v["Depreciation Method"]?.toUpperCase() || "STRAIGHT_LINE") as DepreciationMethod;
    data.capexOpex = (v["Capex/Opex"]?.toUpperCase() || null) as CapexOpex | null;
    data.quantity = v.Quantity ? Number(v.Quantity) : 1;
    data.availableQuantity = v["Available Quantity"] ? Number(v["Available Quantity"]) : null;
    data.isConsumable = parseYesNo(v.Consumable) ?? false;
    data.isPool = parseYesNo(v["Pool Asset"]) ?? false;
    data.rfidTag = v["RFID Tag"] || null;
    data.nfcTag = v["NFC Tag"] || null;
    data.qrPath = v["QR Path"] || null;
    data.labelTemplate = v["Label Template"] || null;
    data.retentionUntil = v["Retention Until"] ? new Date(`${v["Retention Until"]}T00:00:00Z`) : null;
    data.metadata = v.Metadata ? JSON.parse(v.Metadata) : Prisma.JsonNull;
  }
  return data;
}
function valuesOf(asset: Asset, options: Catalog): Record<string, string> {
  const values: Record<string, string> = { "Asset Code": asset.code, "Asset Name": asset.name, Description: asset.description || "" };
  for (const [label, field] of Object.entries(relations)) {
    const option = options[label as keyof Catalog].find(o => o.id === asset[field as typeof relations[keyof typeof relations]]);
    values[label] = option?.name || "";
  }
  return values;
}
function humanValue(label: string, value: string, options: Catalog) {
  const option = options[label as keyof Catalog]?.find(o => o.name === value);
  return option ? option.name : value || "(kosong)";
}
export function selectedIds(raw: unknown): string[] {
  if (!Array.isArray(raw) || !raw.length || raw.length > MAX_BULK_ROWS || raw.some(id => typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))) {
    throw new Error(`Pilih 1–${MAX_BULK_ROWS} asset yang valid.`);
  }
  return [...new Set(raw)] as string[];
}
async function inspect(row: BulkRow, mode: BulkMode, options: Catalog, db: DB, selected?: Set<string>, confirm = false) {
  if (row.result !== "Ready") return;
  if (mode !== "DELETE") fillCategoryClass(row, options);
  let currentStatusId: string | null = null;
  if (mode === "IMPORT") {
    const existing = await db.asset.findFirst({ where: { OR: [{ code: row.code }, ...(row.values["Serial Number"] ? [{ serialNumber: row.values["Serial Number"] }] : [])] } });
    if (existing) {
      row.result = "Duplicate";
      row.reason = existing.code === row.code ? `Asset Code ${row.code} already exists.` : `Serial Number ${row.values["Serial Number"]} already exists.`;
      return;
    }
    for (const [label, field] of [["RFID Tag", "rfidTag"], ["NFC Tag", "nfcTag"]] as const) {
      const tag = row.values[label];
      if (tag && await db.asset.findFirst({ where: { [field]: tag }, select: { id: true } })) {
        row.result = "Duplicate";
        row.reason = `${label} ${tag} already exists.`;
        return;
      }
    }
  } else {
    const asset = await db.asset.findUnique({ where: { code: row.code } });
    if (!asset || asset.deletedAt || (selected && !selected.has(asset.id))) throw new Error("Asset tidak ditemukan, sudah dihapus, atau tidak termasuk pilihan.");
    if (confirm && (row.assetId !== asset.id || row.version !== asset.updatedAt.toISOString())) throw new Error("Asset berubah setelah preview. Buat preview baru agar tidak menimpa perubahan pengguna lain.");
    row.assetId = asset.id;
    row.version = asset.updatedAt.toISOString();
    currentStatusId = asset.assetStatusId;
    if (mode === "UPDATE") {
      const before = valuesOf(asset, options);
      row.changes = Object.entries(row.values).filter(([label, value]) => label !== "Asset Code" && humanValue(label, before[label] || "", options) !== humanValue(label, value, options))
        .map(([field, after]) => ({ field, before: humanValue(field, before[field] || "", options), after: humanValue(field, after, options) }));
    }
  }
  if (mode !== "DELETE") {
    const data = assetData(row, options, mode);
    const disposedStatusId = options.Status.find(o => o.code === DISPOSED_STATUS_CODE)?.id ?? null;
    const statusError = statusChangeError(currentStatusId, data.assetStatusId, disposedStatusId);
    if (statusError) throw new Error(statusError);
    const masterIds = Object.fromEntries(Object.values(relations).filter(field => field in data).map(field => [field, data[field] ?? null])) as Record<string, string | null>;
    if (confirm && (!row.masterIds || Object.keys(row.masterIds).length !== Object.keys(masterIds).length || Object.entries(masterIds).some(([field, id]) => row.masterIds![field] !== id))) {
      throw new Error("Master data berubah setelah preview. Download template dan preview ulang.");
    }
    row.masterIds = masterIds;
  }
}
function asPreview(job: { id: string; mode: string; filename: string; rows: unknown; status: string }): BulkPreview {
  return { id: job.id, mode: job.mode as BulkMode, filename: job.filename, rows: job.rows as BulkRow[], completed: job.status === "COMPLETED" };
}
export async function previewBulk(userId: string, mode: BulkMode, filename: string, rows: BulkRow[], ids?: string[]) {
  const options = await catalog(prisma);
  const selected = ids ? new Set(selectedIds(ids)) : undefined;
  if (mode !== "IMPORT" && !selected) throw new Error("Pilih asset terlebih dahulu.");
  for (const row of rows) {
    try { await inspect(row, mode, options, prisma, selected); }
    catch (error) { row.result = "Invalid"; row.reason = error instanceof Error ? error.message : "Data tidak valid."; }
  }
  const job = await prisma.assetBulkJob.create({ data: { userId, mode, filename: filename.slice(0, 255), rows: rows as unknown as Prisma.InputJsonValue, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
  return asPreview(job);
}
export async function previewDelete(userId: string, rawIds: unknown) {
  const ids = selectedIds(rawIds);
  const assets = await prisma.asset.findMany({ where: { id: { in: ids }, deletedAt: null } });
  if (assets.length !== ids.length) throw new Error("Sebagian asset sudah tidak tersedia. Refresh daftar asset.");
  return previewBulk(userId, "DELETE", "Selected Assets", assets.map((asset, index) => ({ row: index + 1, code: asset.code, name: asset.name, values: {}, result: "Ready", reason: "", changes: [] })), ids);
}
export async function confirmBulk(userId: string, id: string) {
  const result = await prisma.$transaction(async tx => {
    // Locks also serialize with regular CRUD, whose serial number has no UNIQUE constraint.
    // A short, bounded batch avoids adding a breaking constraint to existing data.
    await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;
    await tx.$executeRaw`LOCK TABLE assets IN SHARE ROW EXCLUSIVE MODE`;
    await tx.$executeRaw`LOCK TABLE asset_categories, asset_classes, asset_statuses, asset_locations, departments, asset_users, person_in_charges, units, warranties, vendor_contracts IN SHARE MODE`;
    const job = await tx.assetBulkJob.findFirst({ where: { id, userId } });
    if (!job) throw new Error("Preview tidak ditemukan.");
    if (job.status === "COMPLETED") return asPreview(job);
    if (job.status !== "PREVIEW" || job.expiresAt < new Date()) throw new Error("Preview kedaluwarsa. Upload dan preview ulang.");
    const rows = job.rows as unknown as BulkRow[];
    const mode = job.mode as BulkMode;
    const options = await catalog(tx);
    for (const row of rows) {
      if (row.result !== "Ready") continue;
      await tx.$executeRaw`SAVEPOINT bulk_row`;
      try {
        await inspect(row, mode, options, tx, undefined, true);
        if (String(row.result) === "Duplicate") { await tx.$executeRaw`RELEASE SAVEPOINT bulk_row`; continue; }
        const data = mode === "DELETE" ? { deletedAt: new Date() } : assetData(row, options, mode);
        const asset = mode === "IMPORT"
          ? await tx.asset.create({ data: { ...data, name: row.name, code: row.code, qrToken: `qr_${randomUUID().replaceAll("-", "")}` } })
          : await tx.asset.update({ where: { id: row.assetId!, deletedAt: null }, data });
        await createAssetHistory({ tx, assetId: asset.id, changedById: userId,
          action: mode === "IMPORT" ? "CREATED" : mode === "UPDATE" ? "UPDATED" : "DELETED",
          description: `Bulk ${mode.toLowerCase()}: ${asset.code}`,
          payload: { bulkJobId: job.id, filename: job.filename, changes: row.changes, ...(mode === "DELETE" ? { deletedAt: asset.deletedAt?.toISOString() } : {}) },
        });
        row.assetId = asset.id;
        row.result = "Success";
        row.reason = mode === "DELETE" ? "Soft deleted" : mode === "UPDATE" ? "Updated" : "Imported";
        await tx.$executeRaw`RELEASE SAVEPOINT bulk_row`;
      } catch (error) {
        await tx.$executeRaw`ROLLBACK TO SAVEPOINT bulk_row`;
        await tx.$executeRaw`RELEASE SAVEPOINT bulk_row`;
        row.result = "Failed";
        row.reason = error instanceof Prisma.PrismaClientKnownRequestError ? "Data berubah atau relasi tidak valid. Preview ulang." : error instanceof Error ? error.message : "Proses gagal.";
      }
    }
    const summary = { total: rows.length, success: rows.filter(r => r.result === "Success").length, duplicate: rows.filter(r => r.result === "Duplicate").length, invalid: rows.filter(r => r.result === "Invalid").length, failed: rows.filter(r => r.result === "Failed").length };
    const saved = await tx.assetBulkJob.update({ where: { id: job.id }, data: { status: "COMPLETED", rows: rows as unknown as Prisma.InputJsonValue, summary, completedAt: new Date() } });
    return asPreview(saved);
  }, { timeout: 60000, maxWait: 10000 });
  return result;
}
export async function bulkTemplate(mode: "IMPORT" | "UPDATE", rawIds?: unknown) {
  const options = await catalog(prisma);
  const columns = mode === "IMPORT" ? importColumns : updateColumns;
  let data: string[][] = [];
  if (mode === "UPDATE") {
    const ids = selectedIds(rawIds);
    const assets = await prisma.asset.findMany({ where: { id: { in: ids }, deletedAt: null }, orderBy: { code: "asc" } });
    if (assets.length !== ids.length) throw new Error("Sebagian asset sudah tidak tersedia.");
    data = assets.map(asset => { const values = valuesOf(asset, options); return columns.map(c => values[c] || ""); });
  }
  const instructions: string[][] = [
    ["Field", "Required", "Type", "Instruction"],
    ["Asset Code", "Yes", "Text", "Unik. Contoh AST-000123. Update tidak dapat mengganti kode."],
    ["Asset Name", "Yes", "Text", "Maksimal 255 karakter; nama asset boleh sama."],
    ["Serial Number", "No", "Text", "Unik jika diisi, termasuk asset soft deleted. Simpan sebagai teks untuk mempertahankan nol awal."],
    ["Description", "No", "Text", "Maksimal 5000 karakter."],
    ["Cost", "No", "Number", "Angka >= 0, titik desimal tanpa pemisah ribuan. Contoh 15000000.00."],
    ["Purchase Date", "No", "Date", "YYYY-MM-DD atau sel tanggal Excel. Contoh 2026-09-30. Tidak boleh di masa depan."],
    ["Warranty", "No", "Dropdown", "Warranty End dihitung otomatis dari Purchase Date + durasi warranty."],
    ["Residual Value", "No", "Number", "Angka >= 0 dan tidak lebih besar dari Cost. Contoh 1000000.00."],
    ["Useful Life (Months)", "No", "Integer", "Bilangan bulat >= 1. Contoh 60."],
    ["Depreciation Method", "No", "Dropdown", `${DEPRECIATION_CHOICES.join(" / ")}. Kosong: STRAIGHT_LINE.`],
    ["Capex/Opex", "No", "Dropdown", "CAPEX atau OPEX."],
    ["Quantity", "No", "Integer", "Bilangan bulat >= 1. Kosong: 1."],
    ["Available Quantity", "No", "Integer", "Bilangan bulat >= 0, tidak lebih besar dari Quantity."],
    ["Consumable", "No", "Yes/No", "Yes atau No. Kosong: No."],
    ["Pool Asset", "No", "Yes/No", "Yes atau No. Kosong: No."],
    ["RFID Tag", "No", "Text", "Unik jika diisi."],
    ["NFC Tag", "No", "Text", "Unik jika diisi."],
    ["QR Path", "No", "Text", "Opsional, contoh /qr/asset.png."],
    ["Label Template", "No", "Text", "Opsional, contoh default."],
    ["Retention Until", "No", "Date", "YYYY-MM-DD."],
    ["Metadata", "No", "JSON", 'JSON valid, contoh {"merk":"Epson"}.'],
    ["Photo", "", "Rule", "Foto tidak bisa diimport lewat file. Upload foto dari halaman detail/edit asset setelah import."],
    ["Duplicate", "", "Rule", "Code / serial dibandingkan persis (case-sensitive). Duplikat dilewati; nama asset saja bukan duplicate key."],
    ["Update", "", "Rule", "Kolom opsional kosong menghapus nilai; kolom yang tidak ada dalam file tidak diubah."],
    ["Limit", "", "Rule", `Maksimal ${MAX_BULK_ROWS} baris; 2 MB; tanpa formula. Preview berlaku 30 menit.`],
    ["Category & Class", "", "Rule", "Jika kategori sudah dipasangkan ke class di Master Kategori, kolom Class boleh dikosongkan dan akan diisi otomatis. Class yang berbeda dari class kategori ditolak."],
    ["Master changes", "", "Rule", "Pilihan berasal dari database saat download. Jika nama berubah/dihapus, download template terbaru. Nama ambigu ditolak; administrator perlu membedakan namanya."],
  ];
  for (const label of Object.keys(options).filter(label => columns.includes(label))) {
    instructions.push([label, "No", "Dropdown", `Select ${label} from available database values in Reference Data. ${label === "Status" && mode === "IMPORT" ? "Kosong: default ACTIVE jika tersedia." : "Opsional sesuai model Asset."}`]);
  }
  const choices = (values: readonly string[]) => values.map(value => ({ id: value, name: value }));
  const dropdowns = mode === "IMPORT"
    ? {
        ...options,
        "Depreciation Method": choices(DEPRECIATION_CHOICES),
        "Capex/Opex": choices(CAPEX_OPEX_CHOICES),
        Consumable: choices(YES_NO_CHOICES),
        "Pool Asset": choices(YES_NO_CHOICES),
      }
    : options;
  return masterTemplateBuffer({ name: mode === "IMPORT" ? "Import Asset" : "Update Asset", columns, data, instructions, options: dropdowns });
}
export async function bulkReport(userId: string, id: string) {
  const job = await prisma.assetBulkJob.findFirst({ where: { id, userId } });
  if (!job) throw new Error("Laporan tidak ditemukan.");
  return workbookBuffer([{ name: "Result", rows: [["Row Number", "Asset Code", "Asset Name", "Result", "Error Type", "Error Message"],
    ...(job.rows as unknown as BulkRow[]).map(r => [r.row, r.code, r.name, r.result, ["Ready", "Success"].includes(r.result) ? "" : r.result, r.reason])] }]);
}
