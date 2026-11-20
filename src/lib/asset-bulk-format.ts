import * as XLSX from "xlsx";
import { FUTURE_DATE_MESSAGE, isFutureDate } from "@/lib/datetime";

export const MAX_BULK_ROWS = 200;
export const MAX_BULK_BYTES = 2 * 1024 * 1024;
export const updateColumns = ["Asset Code", "Asset Name", "Category", "Class", "Status", "Location", "Department", "Asset User", "PIC", "Description"];
/** Import covers every field of the "Tambah Asset" form except the photo (uploaded per asset afterwards). */
export const importColumns = [
  ...updateColumns, "Serial Number", "Cost", "Purchase Date",
  "Unit", "Warranty", "Vendor Contract", "Residual Value", "Useful Life (Months)", "Depreciation Method", "Capex/Opex",
  "Quantity", "Available Quantity", "Consumable", "Pool Asset",
  "RFID Tag", "NFC Tag", "QR Path", "Label Template", "Retention Until", "Metadata",
];
export const DEPRECIATION_CHOICES = ["STRAIGHT_LINE", "DECLINING_BALANCE", "UNITS_OF_ACTIVITY", "NONE"] as const;
export const CAPEX_OPEX_CHOICES = ["CAPEX", "OPEX"] as const;
export const YES_NO_CHOICES = ["Yes", "No"] as const;
const LONG_TEXT_COLUMNS = new Set(["Description", "Metadata"]);
const MONEY = /^\d{1,13}(\.\d{1,2})?$/;

/** "Yes"/"No" (also true/false, ya/tidak, 1/0); empty → null. Throws on anything else. */
export function parseYesNo(value: string | undefined) {
  const text = (value ?? "").trim().toLowerCase();
  if (!text) return null;
  if (["yes", "y", "true", "ya", "1"].includes(text)) return true;
  if (["no", "n", "false", "tidak", "0"].includes(text)) return false;
  throw new Error("harus Yes atau No");
}

function dateError(label: string, date: string, futureAllowed: boolean) {
  if (!date) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    return `${label} harus tanggal valid YYYY-MM-DD.`;
  }
  if (!futureAllowed && isFutureDate(new Date(`${date}T00:00:00.000Z`))) return `${label} ${FUTURE_DATE_MESSAGE}`;
  return "";
}

/** Checks the import-only columns; returns the first problem or "". */
function importValueError(values: Record<string, string>) {
  const int = (label: string, min: number) => {
    const text = values[label];
    if (text && (!/^\d{1,9}$/.test(text) || Number(text) < min)) return `${label} harus bilangan bulat minimal ${min}.`;
    return "";
  };
  const errors = [
    values["Residual Value"] && !MONEY.test(values["Residual Value"]) ? "Residual Value harus angka positif maksimal 13 digit dan 2 desimal (gunakan titik)." : "",
    values.Cost && values["Residual Value"] && MONEY.test(values.Cost) && MONEY.test(values["Residual Value"]) && Number(values["Residual Value"]) > Number(values.Cost)
      ? "Residual Value tidak boleh lebih besar dari Cost." : "",
    int("Useful Life (Months)", 1),
    int("Quantity", 1),
    int("Available Quantity", 0),
    values["Available Quantity"] && Number(values["Available Quantity"]) > Number(values.Quantity || "1")
      ? "Available Quantity tidak boleh lebih besar dari Quantity (default 1)." : "",
    values["Depreciation Method"] && !(DEPRECIATION_CHOICES as readonly string[]).includes(values["Depreciation Method"].toUpperCase())
      ? `Depreciation Method harus salah satu: ${DEPRECIATION_CHOICES.join(", ")}.` : "",
    values["Capex/Opex"] && !(CAPEX_OPEX_CHOICES as readonly string[]).includes(values["Capex/Opex"].toUpperCase())
      ? "Capex/Opex harus CAPEX atau OPEX." : "",
    dateError("Retention Until", values["Retention Until"] ?? "", true),
  ];
  for (const label of ["Consumable", "Pool Asset"]) {
    try { parseYesNo(values[label]); } catch { errors.push(`${label} harus Yes atau No.`); }
  }
  if (values.Metadata) {
    try { JSON.parse(values.Metadata); } catch { errors.push('Metadata harus JSON valid, contoh {"key":"value"}.'); }
  }
  return errors.find(Boolean) ?? "";
}
export type BulkMode = "IMPORT" | "UPDATE" | "DELETE";
export type BulkRow = {
  row: number; code: string; name: string; values: Record<string, string>;
  result: "Ready" | "Duplicate" | "Invalid" | "Success" | "Failed";
  reason: string; changes: { field: string; before: string; after: string }[];
  assetId?: string; version?: string;
  masterIds?: Record<string, string | null>;
};
export type BulkPreview = { id: string; mode: BulkMode; filename: string; rows: BulkRow[]; completed: boolean };

// Bound decompression before handing an XLSX archive to the existing parser.
function validateZip(buffer: Buffer) {
  let end = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) { end = i; break; }
  }
  if (end < 0) throw new Error("File XLSX tidak valid.");
  const count = buffer.readUInt16LE(end + 10);
  let offset = buffer.readUInt32LE(end + 16);
  let size = 0;
  if (count > 500 || count === 0) throw new Error("File Excel terlalu kompleks.");
  for (let i = 0; i < count; i++) {
    if (offset + 46 > end || buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Arsip XLSX tidak valid.");
    size += buffer.readUInt32LE(offset + 24);
    if (size > 20 * 1024 * 1024) throw new Error("Isi Excel terlalu besar (maksimal 20 MB setelah ekstraksi).");
    offset += 46 + buffer.readUInt16LE(offset + 28) + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
}

export function parseBulkFile(buffer: Buffer, filename: string, mode: "IMPORT" | "UPDATE"): BulkRow[] {
  if (!buffer.length || buffer.length > MAX_BULK_BYTES) throw new Error("File wajib diisi dan maksimal 2 MB.");
  const excel = /\.xlsx$/i.test(filename);
  if (!excel && !/\.csv$/i.test(filename)) throw new Error("Hanya file .xlsx atau .csv yang didukung.");
  if (excel) validateZip(buffer);
  else if (buffer.includes(0) || buffer.subarray(0, 2).toString() === "PK") throw new Error("File CSV harus berupa teks UTF-8.");
  const book = XLSX.read(excel ? buffer : buffer.toString("utf8"), { type: excel ? "buffer" : "string", raw: true, cellDates: true, cellFormula: true, sheetRows: MAX_BULK_ROWS + 2 });
  const sheet = book.Sheets[book.SheetNames[0]];
  if (!sheet) throw new Error("Sheet pertama tidak ditemukan.");
  const range = XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"] || "A1");
  if (range.e.r > MAX_BULK_ROWS || range.e.c > 30) throw new Error(`Maksimal ${MAX_BULK_ROWS} baris dan 31 kolom per file.`);
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: true, blankrows: true });
  const headers = (matrix[0] || []).map(value => String(value).trim());
  const allowed = mode === "IMPORT" ? importColumns : updateColumns;
  if (!headers.includes("Asset Code") || !headers.includes("Asset Name") || headers.some(h => !allowed.includes(h)) || new Set(headers).size !== headers.length) {
    throw new Error("Header tidak valid. Gunakan template: Asset Code dan Asset Name wajib; kolom asing/duplikat tidak diperbolehkan.");
  }
  const codes = new Set<string>();
  const serials = new Set<string>();
  const tags = { "RFID Tag": new Set<string>(), "NFC Tag": new Set<string>() };
  const rows: BulkRow[] = [];
  matrix.slice(1).forEach((cells, index) => {
    if (cells.every(value => value === "" || value === null)) return;
    const values: Record<string, string> = {};
    let reason = "";
    headers.forEach((header, col) => {
      const cell = sheet[XLSX.utils.encode_cell({ r: index + 1, c: col })];
      if (cell?.f) reason = "Formula tidak diizinkan; gunakan nilai biasa.";
      const value = cells[col];
      values[header] = value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? "").trim();
      if (values[header].length > (LONG_TEXT_COLUMNS.has(header) ? 5000 : 255)) reason = `${header} terlalu panjang.`;
    });
    const code = values["Asset Code"];
    const serial = values["Serial Number"];
    let duplicate = "";
    if (codes.has(code)) duplicate = "Duplicate Asset Code in uploaded file.";
    if (serial && serials.has(serial)) duplicate = "Duplicate Serial Number in uploaded file.";
    for (const [label, seen] of Object.entries(tags)) {
      const tag = values[label];
      if (tag && seen.has(tag)) duplicate = `Duplicate ${label} in uploaded file.`;
      if (tag) seen.add(tag);
    }
    codes.add(code);
    if (serial) serials.add(serial);
    if (!code || !values["Asset Name"]) reason = "Asset Code dan Asset Name wajib diisi.";
    if (values.Cost && !MONEY.test(values.Cost)) reason = "Cost harus angka positif maksimal 13 digit dan 2 desimal (gunakan titik).";
    reason = dateError("Purchase Date", values["Purchase Date"] ?? "", false) || reason;
    if (mode === "IMPORT" && !reason) reason = importValueError(values);
    rows.push({ row: index + 2, code, name: values["Asset Name"], values, result: reason ? "Invalid" : duplicate ? "Duplicate" : "Ready", reason: reason || duplicate, changes: [] });
  });
  if (!rows.length) throw new Error("File tidak memiliki data asset.");
  return rows;
}

export function workbookBuffer(sheets: { name: string; rows: (string | number)[][] }[]) {
  const book = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws["!cols"] = (sheet.rows[0] || []).map(() => ({ wch: 25 }));
    XLSX.utils.book_append_sheet(book, ws, sheet.name);
  }
  return XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
