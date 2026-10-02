"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { parseBulkFile, type BulkPreview } from "@/lib/asset-bulk-format";
import { bulkReport, bulkTemplate, confirmBulk, previewBulk, previewDelete, selectedIds } from "@/lib/asset-bulk";

type Reply<T> = { data: T; error?: never } | { error: string; data?: never };
async function safely<T>(run: () => Promise<T>): Promise<Reply<T>> {
  try { return { data: await run() }; }
  catch (error) {
    // Do not expose database internals or credentials in action responses.
    const message = error instanceof Error && !/prisma|invocation|database|connect|relation|column/i.test(error.message)
      ? error.message : "Proses bulk gagal. Pastikan migration database sudah diterapkan lalu coba kembali.";
    return { error: message };
  }
}
export async function previewAssetBulkAction(form: FormData): Promise<Reply<BulkPreview>> {
  const user = await requirePermission("assets.manage");
  return safely(async () => {
    const mode = form.get("mode");
    if (mode !== "IMPORT" && mode !== "UPDATE") throw new Error("Mode tidak valid.");
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Pilih file Excel atau CSV.");
    const rows = parseBulkFile(Buffer.from(await file.arrayBuffer()), file.name, mode);
    const ids = mode === "UPDATE" ? selectedIds(JSON.parse(String(form.get("ids") || "[]"))) : undefined;
    return previewBulk(user.id, mode, file.name, rows, ids);
  });
}
export async function previewAssetDeleteAction(ids: string[]) {
  const user = await requirePermission("assets.manage");
  return safely(() => previewDelete(user.id, ids));
}
export async function confirmAssetBulkAction(id: string) {
  const user = await requirePermission("assets.manage");
  return safely(async () => {
    const result = await confirmBulk(user.id, id);
    revalidatePath("/dashboard/assets");
    for (const row of result.rows) if (row.assetId && row.result === "Success") revalidatePath(`/dashboard/assets/${row.assetId}`);
    return result;
  });
}
export async function downloadAssetBulkTemplateAction(mode: "IMPORT" | "UPDATE", ids?: string[]) {
  await requirePermission("assets.manage");
  return safely(async () => {
    if (mode !== "IMPORT" && mode !== "UPDATE") throw new Error("Mode tidak valid.");
    return (await bulkTemplate(mode, ids)).toString("base64");
  });
}
export async function downloadAssetBulkReportAction(id: string) {
  const user = await requirePermission("assets.manage");
  return safely(async () => (await bulkReport(user.id, id)).toString("base64"));
}
