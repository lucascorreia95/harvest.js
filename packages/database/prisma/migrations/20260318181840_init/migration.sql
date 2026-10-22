/*
  Warnings:

  - You are about to drop the column `displayName` on the `profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "displayName";

-- CreateTable
CREATE TABLE "plots" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "cropType" TEXT,
    "plantedAt" TIMESTAMP(3),
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plots_profileId_index_key" ON "plots"("profileId", "index");

-- AddForeignKey
ALTER TABLE "plots" ADD CONSTRAINT "plots_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
