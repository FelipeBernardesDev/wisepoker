/*
  Warnings:

  - You are about to drop the column `revoket_at` on the `sessions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "sessions" DROP COLUMN "revoket_at",
ADD COLUMN     "revoked_at" TIMESTAMP(3);
