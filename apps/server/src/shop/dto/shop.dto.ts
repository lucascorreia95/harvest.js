import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export interface ShopItemDto {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: string; // 'SEED', 'FERTILIZER', 'TOOL', 'ANIMAL', etc.
  price: number; // buyPrice na loja
  sellPrice: number;
  minLevel: number;
  isUnlocked?: boolean;
  canAfford?: boolean;
  
  // Atributos específicos quando o item for semente ('SEED')
  growthTime?: number;
  xpReward?: number;
  yieldItemSlug?: string;
  profit?: number; // sellPrice do fruto colhido - price da semente
  coinsPerMinute?: number;
}

export interface ShopCatalogResponseDto {
  serverTime: string;
  totalItems: number;
  availableTypes: string[];
  categories: Record<string, ShopItemDto[]>; // Agrupamento dinâmico por tipo
}

export class BuyItemDto {
  @IsString()
  @IsNotEmpty()
  itemSlug: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export interface BuyItemResponseDto {
  itemSlug: string;
  itemName: string;
  itemType: string;
  quantityBought: number;
  unitPrice: number;
  totalCost: number;
  remainingCoins: number;
  inventoryItem: {
    id: string;
    itemSlug: string;
    quantity: number;
  };
}
