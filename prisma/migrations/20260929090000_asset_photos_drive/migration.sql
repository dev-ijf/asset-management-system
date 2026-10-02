ALTER TABLE "asset_photos"
  ADD COLUMN "drive_file_id" TEXT,
  ADD COLUMN "filename" TEXT,
  ADD COLUMN "mime_type" TEXT,
  ADD COLUMN "size" INTEGER;
CREATE UNIQUE INDEX "asset_photos_drive_file_id_key" ON "asset_photos"("drive_file_id");
CREATE TABLE "drive_photo_cleanup" (
  "file_id" TEXT NOT NULL,
  "due_at" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "drive_photo_cleanup_pkey" PRIMARY KEY ("file_id")
);
