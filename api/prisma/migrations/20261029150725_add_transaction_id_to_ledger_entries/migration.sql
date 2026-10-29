/*
  Warnings:

  - A unique constraint covering the columns `[transaction_id,account_id]` on the table `ledger_entries` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `public_id` on the `accounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `transaction_id` to the `ledger_entries` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `public_id` on the `ledger_entries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterEnum
ALTER TYPE "TxType" ADD VALUE 'FREE_CLAIM';

-- DropForeignKey
ALTER TABLE "ledger_entries" DROP CONSTRAINT "ledger_entries_account_id_fkey";

-- AlterTable
ALTER TABLE "accounts" DROP COLUMN "public_id",
ADD COLUMN     "public_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "ledger_entries" ADD COLUMN     "transaction_id" UUID NOT NULL,
DROP COLUMN "public_id",
ADD COLUMN     "public_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_public_id_key" ON "accounts"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_public_id_key" ON "ledger_entries"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_transaction_id_account_id_key" ON "ledger_entries"("transaction_id", "account_id");

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
