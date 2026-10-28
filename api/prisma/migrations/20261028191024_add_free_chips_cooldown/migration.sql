-- AlterTable
ALTER TABLE "users" ADD COLUMN     "free_chips_last_claim_at" TIMESTAMP(3),
ADD COLUMN     "free_chips_next_claim_at" TIMESTAMP(3);
