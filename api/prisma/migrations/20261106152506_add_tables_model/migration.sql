-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('WAITING', 'ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "tables" (
    "id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'WAITING',
    "currency" "Currency" NOT NULL DEFAULT 'PLAY',
    "config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tables_public_id_key" ON "tables"("public_id");

-- CreateIndex
CREATE INDEX "tables_status_idx" ON "tables"("status");

