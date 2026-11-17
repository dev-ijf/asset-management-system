ALTER TABLE "assets"
ADD COLUMN "archive_reason" TEXT,
ADD COLUMN "restored_at" TIMESTAMP(3),
ADD COLUMN "restored_by" UUID;

ALTER TABLE "assets"
ADD CONSTRAINT "assets_restored_by_fkey"
FOREIGN KEY ("restored_by") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "assets_archived_at_idx" ON "assets"("archived_at");
