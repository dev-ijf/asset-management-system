import "dotenv/config";
import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { OAuth2Client } from "google-auth-library";
import { compressAssetPhoto, assetPhotoFilename, optionalPhoto } from "../src/lib/asset-image.ts";
import { prepareAssetPhoto, attachAssetPhoto, discardPreparedPhoto, removePhotoRecord, cleanupDrivePhotos } from "../src/lib/asset-photo-storage.ts";
import { prisma } from "../src/lib/prisma.ts";

test("Backend decodes, resizes, strips EXIF and outputs WebP without upscaling", async () => {
  const large = await sharp({ create: { width: 2400, height: 1200, channels: 3, background: "red" } }).jpeg().withMetadata().toBuffer();
  const compressed = await compressAssetPhoto(new File([large], "photo.jpg", { type: "image/jpeg" }));
  const info = await sharp(compressed).metadata();
  assert.equal(info.format, "webp");
  assert.equal(info.width, 1600); assert.equal(info.height, 800);
  assert.equal(info.exif, undefined);
  const small = await sharp({ create: { width: 100, height: 50, channels: 3, background: "blue" } }).png().toBuffer();
  const smallInfo = await sharp(await compressAssetPhoto(new File([small], "small.png", { type: "image/png" }))).metadata();
  assert.equal(smallInfo.width, 100); assert.equal(smallInfo.height, 50);
  const rotated = await sharp(small).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const rotatedInfo = await sharp(await compressAssetPhoto(new File([rotated], "rotated.jpeg", { type: "image/jpeg" }))).metadata();
  assert.equal(rotatedInfo.width, 50); assert.equal(rotatedInfo.height, 100);
});

test("Rejects forged MIME, unsupported formats, corrupted images and oversized input", async () => {
  for (const file of [
    new File(["not an image"], "fake.jpg", { type: "image/jpeg" }),
    new File(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'], "fake.png", { type: "image/png" }),
    new File(["data"], "bad.gif", { type: "image/gif" }),
    new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" }),
  ]) await assert.rejects(() => compressAssetPhoto(file));
  assert.match(assetPhotoFilename("../../AST 001"), /^[\w-]+\.webp$/);
  assert.equal(optionalPhoto(new FormData()), null);
});

test("Drive + DB lifecycle: upload, rollback, replacement cleanup retry and soft delete retention", async () => {
  // Real local database, mocked Google transport; never sends credentials/files to Google.
  const savedFetch = globalThis.fetch;
  const savedToken = OAuth2Client.prototype.getAccessToken;
  const envKeys = ["GOOGLE_DRIVE_CLIENT_ID", "GOOGLE_DRIVE_CLIENT_SECRET", "GOOGLE_DRIVE_REFRESH_TOKEN", "GOOGLE_DRIVE_FOLDER_ID"];
  const savedEnv = envKeys.map(key => process.env[key]);
  envKeys.forEach(key => { process.env[key] = "test-only"; });
  OAuth2Client.prototype.getAccessToken = async () => ({ token: "mock-token" });
  const files = new Set(); const allocated = []; const assetIds = [];
  let uploadFails = false; let deleteFails = false; let publicFolder = false;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("generateIds")) { const id = `test-${randomUUID()}`; allocated.push(id); return Response.json({ ids: [id] }); }
    if (url.includes("uploadType")) {
      if (uploadFails) return new Response(null, { status: 503 });
      const text = Buffer.from(init.body).toString();
      assert.ok(text.includes('"mimeType":"image/webp"'));
      assert.ok(!text.includes('"anyone"'));
      const id = text.match(/"id":"([^"]+)"/)[1]; files.add(id); return Response.json({ id });
    }
    if (init?.method === "DELETE") {
      if (deleteFails) return new Response(null, { status: 503 });
      files.delete(url.split('/').pop()); return new Response(null, { status: 204 });
    }
    return Response.json({ mimeType: "application/vnd.google-apps.folder", permissions: [{ type: publicFolder ? "anyone" : "user" }], capabilities: { canAddChildren: true } });
  };
  try {
    const bytes = await sharp({ create: { width: 20, height: 10, channels: 3, background: "red" } }).png().toBuffer();
    const file = new File([bytes], "test.png", { type: "image/png" });
    const photo = await prepareAssetPhoto(file, "TEST");
    assert.ok(files.has(photo.driveFileId));
    await assert.rejects(() => prisma.$transaction(async tx => {
      const asset = await tx.asset.create({ data: { code: `TEST-${randomUUID()}`, name: "Rollback test", qrToken: randomUUID() } });
      await attachAssetPhoto(tx, asset.id, photo, true);
      throw new Error("Simulated DB failure");
    }));
    await discardPreparedPhoto(photo);
    assert.ok(!files.has(photo.driveFileId));
    assert.equal(await prisma.assetPhoto.findUnique({ where: { driveFileId: photo.driveFileId } }), null);

    const kept = await prepareAssetPhoto(file, "TEST");
    const asset = await prisma.$transaction(async tx => {
      const a = await tx.asset.create({ data: { code: `TEST-${randomUUID()}`, name: "Photo test", qrToken: randomUUID() } });
      await attachAssetPhoto(tx, a.id, kept, true); return a;
    });
    assetIds.push(asset.id);
    assert.equal(await prisma.drivePhotoCleanup.findUnique({ where: { fileId: kept.driveFileId } }), null);
    await prisma.asset.update({ where: { id: asset.id }, data: { deletedAt: new Date() } });
    assert.ok(files.has(kept.driveFileId));
    assert.ok(await prisma.assetPhoto.findUnique({ where: { id: kept.id } }));
    await prisma.asset.update({ where: { id: asset.id }, data: { deletedAt: null } });

    const replacement = await prepareAssetPhoto(file, "TEST");
    await prisma.$transaction(async tx => {
      await removePhotoRecord(tx, asset.id, kept.id);
      await attachAssetPhoto(tx, asset.id, replacement, true);
    });
    deleteFails = true;
    assert.equal((await cleanupDrivePhotos([kept.driveFileId])).failed, 1);
    assert.ok(await prisma.drivePhotoCleanup.findUnique({ where: { fileId: kept.driveFileId } }));
    deleteFails = false;
    await prisma.drivePhotoCleanup.update({ where: { fileId: kept.driveFileId }, data: { dueAt: new Date(0) } });
    await cleanupDrivePhotos([kept.driveFileId]);
    assert.ok(!files.has(kept.driveFileId)); assert.ok(files.has(replacement.driveFileId));

    uploadFails = true;
    await assert.rejects(() => prepareAssetPhoto(file, "TEST"));
    assert.ok(await prisma.drivePhotoCleanup.findUnique({ where: { fileId: allocated.at(-1) } }));
    publicFolder = true;
    await assert.rejects(() => prepareAssetPhoto(file, "TEST"), /Restricted/);
  } finally {
    globalThis.fetch = savedFetch;
    OAuth2Client.prototype.getAccessToken = savedToken;
    envKeys.forEach((key, index) => { if (savedEnv[index] === undefined) delete process.env[key]; else process.env[key] = savedEnv[index]; });
    await prisma.asset.deleteMany({ where: { id: { in: assetIds } } });
    await prisma.drivePhotoCleanup.deleteMany({ where: { fileId: { in: allocated } } });
    await prisma.$disconnect();
  }
});
