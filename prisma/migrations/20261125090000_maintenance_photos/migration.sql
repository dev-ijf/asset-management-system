-- Photos of the damage attached to maintenance requests (kept on the maintenance after approval).
-- CreateTable
CREATE TABLE "maintenance_photos" (
    "id" UUID NOT NULL,
    "asset_id" UUID NOT NULL,
    "approval_request_id" UUID,
    "maintenance_id" UUID,
    "drive_file_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_photos_drive_file_id_key" ON "maintenance_photos"("drive_file_id");

-- CreateIndex
CREATE INDEX "maintenance_photos_approval_request_id_idx" ON "maintenance_photos"("approval_request_id");

-- CreateIndex
CREATE INDEX "maintenance_photos_maintenance_id_idx" ON "maintenance_photos"("maintenance_id");

-- AddForeignKey
ALTER TABLE "maintenance_photos" ADD CONSTRAINT "maintenance_photos_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_photos" ADD CONSTRAINT "maintenance_photos_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "asset_approval_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_photos" ADD CONSTRAINT "maintenance_photos_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "asset_maintenances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

