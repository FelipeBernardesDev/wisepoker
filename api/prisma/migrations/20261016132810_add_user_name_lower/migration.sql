/*
  Warnings:

  - A unique constraint covering the columns `[user_name_lower]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_name_lower` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "users_user_name_key";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "user_name_lower" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_lower_key" ON "users"("user_name_lower");
