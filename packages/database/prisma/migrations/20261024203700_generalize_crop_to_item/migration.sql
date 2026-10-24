-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "buyPrice" INTEGER NOT NULL DEFAULT 0,
    "sellPrice" INTEGER NOT NULL DEFAULT 0,
    "minLevel" INTEGER NOT NULL DEFAULT 1,
    "growthTime" INTEGER,
    "xpReward" INTEGER,
    "yieldItemSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "items_slug_key" ON "items"("slug");

-- Populate Items
INSERT INTO "items" ("id", "slug", "name", "description", "type", "buyPrice", "sellPrice", "minLevel", "growthTime", "xpReward", "yieldItemSlug")
VALUES
('item_seed_wheat', 'wheat_seed', 'Semente de Trigo', 'Semente de trigo de crescimento rápido (30s).', 'SEED', 10, 5, 1, 30, 5, 'wheat'),
('item_seed_carrot', 'carrot_seed', 'Semente de Cenoura', 'Semente de cenoura comum (2min).', 'SEED', 30, 15, 2, 120, 15, 'carrot'),
('item_seed_corn', 'corn_seed', 'Semente de Milho', 'Semente de milho dourado (5min).', 'SEED', 80, 40, 5, 300, 40, 'corn'),
('item_crop_wheat', 'wheat', 'Trigo', 'Trigo colhido fresco, pronto para venda.', 'CROP', 0, 25, 1, NULL, NULL, NULL),
('item_crop_carrot', 'carrot', 'Cenoura', 'Cenoura colhida e crocante.', 'CROP', 0, 80, 2, NULL, NULL, NULL),
('item_crop_corn', 'corn', 'Milho', 'Espiga de milho colhida.', 'CROP', 0, 220, 5, NULL, NULL, NULL)
ON CONFLICT ("slug") DO NOTHING;

-- Update inventory_items
UPDATE "inventory_items" SET "itemSlug" = 'wheat_seed' WHERE "itemSlug" = 'wheat';
ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_profileId_itemType_itemSlug_key";
ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "itemType";
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_profileId_itemSlug_key" UNIQUE ("profileId", "itemSlug");
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_itemSlug_fkey" FOREIGN KEY ("itemSlug") REFERENCES "items"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update plots
ALTER TABLE "plots" DROP CONSTRAINT IF EXISTS "plots_cropType_fkey";
UPDATE "plots" SET "cropType" = 'wheat_seed' WHERE "cropType" = 'wheat';
ALTER TABLE "plots" ADD CONSTRAINT "plots_cropType_fkey" FOREIGN KEY ("cropType") REFERENCES "items"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop crops
DROP TABLE IF EXISTS "crops" CASCADE;
