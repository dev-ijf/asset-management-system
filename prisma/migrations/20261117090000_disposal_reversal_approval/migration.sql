-- Reverse disposal goes through approval and requires a reason.
ALTER TYPE "ApprovalTransactionType" ADD VALUE IF NOT EXISTS 'DISPOSAL_REVERSAL';

ALTER TABLE "asset_disposals" ADD COLUMN IF NOT EXISTS "reversal_reason" TEXT;
