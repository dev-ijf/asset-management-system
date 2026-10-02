import "dotenv/config";
import { createDriveStorageFolder } from "../src/lib/google-drive";

if (process.env.GOOGLE_DRIVE_FOLDER_ID?.trim()) {
  throw new Error("GOOGLE_DRIVE_FOLDER_ID sudah terisi. Setup dibatalkan agar tidak membuat folder ganda.");
}
const root = await createDriveStorageFolder("Asset Management Storage");
console.log(`Folder induk: https://drive.google.com/drive/folders/${root}`);
const photos = await createDriveStorageFolder("Asset Photos", root);
console.log(`Tambahkan ke .env: GOOGLE_DRIVE_FOLDER_ID=${photos}`);
console.log(`Folder foto: https://drive.google.com/drive/folders/${photos}`);
