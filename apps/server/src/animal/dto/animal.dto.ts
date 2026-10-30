import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export interface AnimalDto {
  id: string;
  animalSlug: string;
  animalName: string;
  animalType: string;
  fedAt?: string;
  productReady: boolean;
  weight?: number;
  maxWeight?: number;
  canFeed: boolean;
  canCollect: boolean;
  canSell: boolean;
  productionTime?: number;
  foodSlug?: string;
  foodQuantity?: number;
  yieldItemSlug?: string;
}

export interface AnimalsResponseDto {
  serverTime: string;
  totalAnimals: number;
  animals: AnimalDto[];
}

export class FeedAnimalDto {
  @IsString()
  @IsNotEmpty()
  animalSlug: string;
}

export interface FeedAnimalResponseDto {
  animalSlug: string;
  animalName: string;
  fedAt: string;
  productReadyAt: string;
  remainingFood: number;
}

export class CollectProductDto {
  @IsString()
  @IsNotEmpty()
  animalSlug: string;
}

export interface CollectProductResponseDto {
  animalSlug: string;
  animalName: string;
  productSlug: string;
  productName: string;
  quantity: number;
}

export class SellAnimalDto {
  @IsString()
  @IsNotEmpty()
  animalSlug: string;
}

export interface SellAnimalResponseDto {
  animalSlug: string;
  animalName: string;
  weight: number;
  sellPrice: number;
  earnedCoins: number;
}
