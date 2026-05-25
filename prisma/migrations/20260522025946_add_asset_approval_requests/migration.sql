-- CreateEnum
CREATE TYPE "ApprovalTransactionType" AS ENUM ('MOVEMENT', 'DISPOSAL', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "asset_approval_requests" (
    "id" UUID NOT NULL,
    "transaction_type" "ApprovalTransactionType" NOT NULL,
    "asset_id" UUID NOT NULL,
    "requester_id" UUID,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "reject_note" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_approval_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "asset_approval_requests" ADD CONSTRAINT "asset_approval_requests_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_approval_requests" ADD CONSTRAINT "asset_approval_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_approval_requests" ADD CONSTRAINT "asset_approval_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
