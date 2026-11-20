-- Warranty end was never stored when an asset was saved, so the dashboard
-- "Warranty Akan Habis" card always showed 0. Fill it from purchase date + warranty duration.
UPDATE "assets" AS a
SET "warranty_end" = (a."purchase_date" + make_interval(months => w."duration_months"))::date
FROM "warranties" AS w
WHERE a."warranty_id" = w."id" AND a."purchase_date" IS NOT NULL;
