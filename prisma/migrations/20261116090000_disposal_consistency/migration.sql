-- Disposal consistency (QA K9, K10).
-- 1) Ensure the system statuses the disposal workflow depends on exist.
-- 2) Repair data left behind by double disposal and inconsistent reverse.
-- Every repaired asset gets an asset_histories row (action DATA_REPAIR) so the change is traceable.

INSERT INTO "asset_statuses" ("id", "name", "code", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), 'Aktif', 'ACTIVE', 'Aset siap digunakan', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "asset_statuses" WHERE "code" = 'ACTIVE');

INSERT INTO "asset_statuses" ("id", "name", "code", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), 'Disposed', 'DISPOSED', 'Aset sudah didisposal melalui approval', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "asset_statuses" WHERE "code" = 'DISPOSED');

-- 2a) An asset may have only one active (not reversed) disposal. Keep the earliest, close the duplicates.
WITH ranked AS (
    SELECT "id", "asset_id",
           ROW_NUMBER() OVER (PARTITION BY "asset_id" ORDER BY "created_at", "id") AS rn
    FROM "asset_disposals"
    WHERE "reversed_at" IS NULL
),
closed AS (
    UPDATE "asset_disposals" d
    SET "reversed_at" = NOW(), "updated_at" = NOW()
    FROM ranked r
    WHERE d."id" = r."id" AND r.rn > 1
    RETURNING d."id", d."asset_id"
)
INSERT INTO "asset_histories" ("id", "asset_id", "action", "description", "payload", "created_at", "updated_at")
SELECT gen_random_uuid(), "asset_id", 'DATA_REPAIR',
       'Disposal ganda ditutup otomatis oleh perbaikan data (QA K9).',
       jsonb_build_object('disposalId', "id", 'reason', 'duplicate_active_disposal'),
       NOW(), NOW()
FROM closed;

-- 2b) Only one pending disposal request per asset. Keep the earliest, cancel the rest.
WITH ranked AS (
    SELECT "id",
           ROW_NUMBER() OVER (PARTITION BY "asset_id" ORDER BY "created_at", "id") AS rn
    FROM "asset_approval_requests"
    WHERE "transaction_type" = 'DISPOSAL' AND "status" = 'PENDING'
)
UPDATE "asset_approval_requests" a
SET "status" = 'CANCELLED',
    "reject_note" = 'Dibatalkan otomatis: request disposal ganda untuk asset yang sama.',
    "updated_at" = NOW()
FROM ranked r
WHERE a."id" = r."id" AND r.rn > 1;

-- 2c) Pending disposal requests for assets that already have an active disposal can never be applied.
UPDATE "asset_approval_requests" a
SET "status" = 'CANCELLED',
    "reject_note" = 'Dibatalkan otomatis: asset sudah memiliki disposal aktif.',
    "updated_at" = NOW()
WHERE a."transaction_type" = 'DISPOSAL'
  AND a."status" = 'PENDING'
  AND EXISTS (SELECT 1 FROM "asset_disposals" d WHERE d."asset_id" = a."asset_id" AND d."reversed_at" IS NULL);

-- 2d) An asset with an active disposal must have status DISPOSED.
WITH disposed AS (
    SELECT "id" FROM "asset_statuses" WHERE "code" = 'DISPOSED'
),
fixed AS (
    UPDATE "assets" a
    SET "asset_status_id" = (SELECT "id" FROM disposed), "updated_at" = NOW()
    WHERE EXISTS (SELECT 1 FROM "asset_disposals" d WHERE d."asset_id" = a."id" AND d."reversed_at" IS NULL)
      AND a."asset_status_id" IS DISTINCT FROM (SELECT "id" FROM disposed)
    RETURNING a."id"
)
INSERT INTO "asset_histories" ("id", "asset_id", "action", "description", "payload", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'DATA_REPAIR',
       'Status disamakan menjadi DISPOSED karena asset masih memiliki disposal aktif (QA K10).',
       jsonb_build_object('reason', 'active_disposal_status_mismatch'),
       NOW(), NOW()
FROM fixed;

-- 2e) An asset with status DISPOSED but no active disposal is restored to the status before its latest
--     disposal, or ACTIVE when that is unknown. Otherwise it would be stuck: DISPOSED can only be cleared by reverse.
WITH disposed AS (
    SELECT "id" FROM "asset_statuses" WHERE "code" = 'DISPOSED'
),
active_status AS (
    SELECT "id" FROM "asset_statuses" WHERE "code" = 'ACTIVE'
),
targets AS (
    SELECT a."id",
           COALESCE(
               (SELECT d."previous_status_id"
                FROM "asset_disposals" d
                WHERE d."asset_id" = a."id"
                  AND d."previous_status_id" IS NOT NULL
                  AND d."previous_status_id" <> (SELECT "id" FROM disposed)
                ORDER BY d."created_at" DESC
                LIMIT 1),
               (SELECT "id" FROM active_status)
           ) AS restored_status_id
    FROM "assets" a
    WHERE a."asset_status_id" = (SELECT "id" FROM disposed)
      AND NOT EXISTS (SELECT 1 FROM "asset_disposals" d WHERE d."asset_id" = a."id" AND d."reversed_at" IS NULL)
),
fixed AS (
    UPDATE "assets" a
    SET "asset_status_id" = t.restored_status_id, "updated_at" = NOW()
    FROM targets t
    WHERE a."id" = t."id"
    RETURNING a."id", t.restored_status_id
)
INSERT INTO "asset_histories" ("id", "asset_id", "action", "description", "payload", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'DATA_REPAIR',
       'Status DISPOSED tanpa disposal aktif dikembalikan ke status sebelum disposal (QA K10).',
       jsonb_build_object('reason', 'disposed_status_without_active_disposal', 'restoredStatusId', restored_status_id),
       NOW(), NOW()
FROM fixed;
