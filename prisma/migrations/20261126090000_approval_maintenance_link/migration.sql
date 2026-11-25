-- AlterTable
ALTER TABLE "asset_approval_requests" ADD COLUMN     "maintenance_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "asset_approval_requests_maintenance_id_key" ON "asset_approval_requests"("maintenance_id");

-- AddForeignKey
ALTER TABLE "asset_approval_requests" ADD CONSTRAINT "asset_approval_requests_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "asset_maintenances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: approvals already applied recorded both ids in the asset history entry.
UPDATE "asset_approval_requests" AS r
SET "maintenance_id" = m."id"
FROM (
  SELECT DISTINCT ON (h."payload"->>'approvalRequestId')
    h."payload"->>'approvalRequestId' AS request_id,
    h."payload"->>'maintenanceId' AS maintenance_id
  FROM "asset_histories" h
  WHERE h."payload" ? 'approvalRequestId'
    AND h."payload" ? 'maintenanceId'
    AND h."action" IN ('MAINTENANCE_CREATED', 'MAINTENANCE_COMPLETED')
  ORDER BY h."payload"->>'approvalRequestId', h."created_at"
) AS link
JOIN "asset_maintenances" m ON m."id"::text = link.maintenance_id
WHERE r."id"::text = link.request_id
  AND r."transaction_type" = 'MAINTENANCE'
  AND r."maintenance_id" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "asset_approval_requests" x WHERE x."maintenance_id" = m."id");
