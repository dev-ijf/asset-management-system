-- Asset class is now set on a (top-level) category; sub-categories and assets follow it.
-- Nullable, so existing categories keep working with a manually chosen class until one is set.

-- AlterTable
ALTER TABLE "asset_categories" ADD COLUMN     "asset_class_id" UUID;

-- CreateIndex
CREATE INDEX "asset_categories_asset_class_id_idx" ON "asset_categories"("asset_class_id");

-- AddForeignKey
ALTER TABLE "asset_categories" ADD CONSTRAINT "asset_categories_asset_class_id_fkey" FOREIGN KEY ("asset_class_id") REFERENCES "asset_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
