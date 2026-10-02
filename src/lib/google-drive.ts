import { OAuth2Client } from "google-auth-library";
import { randomUUID } from "node:crypto";
import { PhotoError } from "./asset-image";

const DRIVE = "https://www.googleapis.com/drive/v3/files";

function config() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN?.trim();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new PhotoError("Storage Google Drive belum dikonfigurasi. Hubungi administrator atau simpan tanpa foto.");
  }
  return { clientId, clientSecret, refreshToken, folderId };
}

function storageFolder() {
  const id = config().folderId;
  if (!id || !/^[\w-]+$/.test(id)) throw new PhotoError("GOOGLE_DRIVE_FOLDER_ID belum diatur dengan benar.");
  return id;
}

// One-time setup lets drive.file scope access only folders/files created by this app.
export async function createDriveStorageFolder(name: string, parent?: string) {
  const response = await driveFetch(`${DRIVE}?fields=id`, { method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parent ? { parents: [parent] } : {}) }),
  });
  if (!response.ok) throw new PhotoError("Pembuatan folder storage gagal. Periksa izin OAuth Drive.");
  const result = await response.json();
  if (typeof result.id !== "string") throw new PhotoError("ID folder Drive tidak tersedia.");
  return result.id as string;
}

async function driveFetch(url: string, init: RequestInit = {}) {
  const settings = config();
  const auth = new OAuth2Client(settings.clientId, settings.clientSecret);
  auth.setCredentials({ refresh_token: settings.refreshToken });
  try {
    const { token } = await auth.getAccessToken();
    if (!token) throw new Error("No access token");
    return await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` },
      cache: "no-store", signal: AbortSignal.timeout(60000) });
  } catch {
    throw new PhotoError("Koneksi Google Drive gagal. Periksa konfigurasi storage atau coba lagi.");
  }
}

export async function allocateDrivePhoto() {
  const folder = await driveFetch(`${DRIVE}/${storageFolder()}?fields=id,mimeType,trashed,permissions(type),capabilities(canAddChildren)`);
  if (!folder.ok) throw new PhotoError("Folder Google Drive tidak dapat diakses oleh akun storage.");
  const info = await folder.json();
  if (info.mimeType !== "application/vnd.google-apps.folder" || info.trashed || !info.capabilities?.canAddChildren) {
    throw new PhotoError("Folder storage tidak valid atau akun storage tidak dapat mengunggah file.");
  }
  if (info.permissions?.some((p: { type: string }) => p.type === "anyone")) {
    throw new PhotoError("Folder storage harus Restricted, bukan Anyone with the link.");
  }
  const response = await driveFetch(`${DRIVE}/generateIds?count=1&space=drive&type=files`);
  if (!response.ok) throw new PhotoError("Google Drive belum dapat menyiapkan upload. Coba lagi.");
  const result = await response.json();
  if (typeof result.ids?.[0] !== "string") throw new PhotoError("Google Drive tidak mengembalikan ID file.");
  return result.ids[0] as string;
}

export async function uploadDrivePhoto(id: string, filename: string, bytes: Buffer) {
  const boundary = `asset_${randomUUID()}`;
  const metadata = JSON.stringify({ id, name: filename, mimeType: "image/webp", parents: [storageFolder()] });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: image/webp\r\n\r\n`),
    bytes, Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  const response = await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
    method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body: new Uint8Array(body),
  });
  if (!response.ok || (await response.json()).id !== id) {
    throw new PhotoError("Upload Google Drive gagal. Asset belum disimpan; silakan coba lagi.");
  }
}

export async function deleteDrivePhoto(id: string) {
  const response = await driveFetch(`${DRIVE}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok && response.status !== 404) throw new PhotoError("Pembersihan foto Drive belum berhasil.");
}

export async function readDrivePhoto(id: string) {
  const response = await driveFetch(`${DRIVE}/${encodeURIComponent(id)}?alt=media`);
  if (!response.ok || !response.body) throw new PhotoError("Foto tidak dapat diambil dari Google Drive.");
  return response.body;
}
