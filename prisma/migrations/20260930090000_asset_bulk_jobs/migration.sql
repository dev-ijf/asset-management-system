CREATE TABLE "asset_bulk_jobs" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "mode" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PREVIEW',
  "rows" JSONB NOT NULL,
  "summary" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "asset_bulk_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "asset_bulk_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "asset_bulk_jobs_user_id_created_at_idx" ON "asset_bulk_jobs"("user_id", "created_at");
