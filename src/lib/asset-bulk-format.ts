import * as XLSX from "xlsx";

export const MAX_BULK_ROWS = 200;
export const MAX_BULK_BYTES = 2 * 1024 * 1024;
export const updateColumns = ["Asset Code", "Asset Name", "Category", "Class", "Status", "Location", "Department", "Asset User", "PIC", "Description"];
export const importColumns = [...updateColumns, "Serial Number", "Cost", "Purchase Date"];
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
      if (values[header].length > (header === "Description" ? 5000 : 255)) reason = `${header} terlalu panjang.`;
    });
    const code = values["Asset Code"];
    const serial = values["Serial Number"];
    let duplicate = "";
    if (codes.has(code)) duplicate = "Duplicate Asset Code in uploaded file.";
    if (serial && serials.has(serial)) duplicate = "Duplicate Serial Number in uploaded file.";
    codes.add(code);
    if (serial) serials.add(serial);
    if (!code || !values["Asset Name"]) reason = "Asset Code dan Asset Name wajib diisi.";
    if (values.Cost && (!/^\d{1,13}(\.\d{1,2})?$/.test(values.Cost))) reason = "Cost harus angka positif maksimal 13 digit dan 2 desimal (gunakan titik).";
    const date = values["Purchase Date"];
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) reason = "Purchase Date harus tanggal valid YYYY-MM-DD.";
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
