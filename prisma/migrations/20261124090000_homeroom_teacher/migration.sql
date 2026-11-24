-- Homeroom teacher: new-asset requests, plus the permissions and role for class-scoped access.

-- CreateEnum
CREATE TYPE "AssetRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateTable
CREATE TABLE "asset_requests" (
    "id" UUID NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "asset_location_id" UUID,
    "requester_id" UUID,
    "status" "AssetRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reject_note" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "fulfilled_by" UUID,
    "fulfilled_at" TIMESTAMP(3),
    "fulfilled_note" TEXT,
    "fulfilled_asset_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "asset_requests_status_idx" ON "asset_requests"("status");
CREATE INDEX "asset_requests_requester_id_idx" ON "asset_requests"("requester_id");

-- AddForeignKey
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_asset_location_id_fkey" FOREIGN KEY ("asset_location_id") REFERENCES "asset_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_fulfilled_by_fkey" FOREIGN KEY ("fulfilled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asset_requests" ADD CONSTRAINT "asset_requests_fulfilled_asset_id_fkey" FOREIGN KEY ("fulfilled_asset_id") REFERENCES "assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Permissions and role (idempotent; existing rows and role edits are left alone).
INSERT INTO "permissions" ("uuid", "name", "guard_name", "updated_at")
SELECT gen_random_uuid(), p.name, 'web', CURRENT_TIMESTAMP
FROM (VALUES ('class-assets.view'), ('maintenance.request'), ('asset-requests.create')) AS p(name)
ON CONFLICT ("name", "guard_name") DO NOTHING;

INSERT INTO "roles" ("uuid", "name", "guard_name", "updated_at")
VALUES (gen_random_uuid(), 'homeroom-teacher', 'web', CURRENT_TIMESTAMP)
ON CONFLICT ("name", "guard_name") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."uuid", p."uuid"
FROM "roles" r
JOIN "permissions" p ON p."guard_name" = 'web'
  AND p."name" IN ('class-assets.view', 'maintenance.request', 'asset-requests.create')
WHERE r."name" = 'homeroom-teacher' AND r."guard_name" = 'web'
ON CONFLICT DO NOTHING;
