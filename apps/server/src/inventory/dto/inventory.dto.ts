import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export type InventoryItemType = 'SEED' | 'CROP' | 'FERTILIZER' | 'TOOL';

export interface InventoryItemDetailDto {
  id: string;
  itemSlug: string;
  itemType: string;
  name: string;
  description?: string;
  quantity: number;
  unitBuyPrice: number;
  unitSellPrice: number;
  totalSellPrice: number;
  details?: {
    growthTime?: number;
    xpReward?: number;
    minLevel?: number;
    yieldItemSlug?: string;
  };
}

export interface InventoryResponseDto {
  serverTime: string;
  totalItems: number;
  items: InventoryItemDetailDto[];
}

export class SellItemDto {
  @IsString()
  @IsNotEmpty()
  itemSlug: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export interface SellItemResponseDto {
  itemSlug: string;
  itemName: string;
  itemType: string;
  quantitySold: number;
  unitPrice: number;
  earnedCoins: number;
  remainingQuantity: number;
  newTotalCoins: number;
}
