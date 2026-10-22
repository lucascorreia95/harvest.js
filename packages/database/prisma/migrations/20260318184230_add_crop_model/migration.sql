-- CreateTable
CREATE TABLE "crops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "sellPrice" INTEGER NOT NULL,
    "xpReward" INTEGER NOT NULL,
    "growthTime" INTEGER NOT NULL,
    "minLevel" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crops_name_key" ON "crops"("name");

-- CreateIndex
CREATE UNIQUE INDEX "crops_slug_key" ON "crops"("slug");

-- AddForeignKey
ALTER TABLE "plots" ADD CONSTRAINT "plots_cropType_fkey" FOREIGN KEY ("cropType") REFERENCES "crops"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
