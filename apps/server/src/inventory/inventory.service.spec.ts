import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';
import { BadRequestException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let mockPrismaService: any;
  let mockUsersService: any;
  let mockActivityService: any;

  beforeEach(async () => {
    mockPrismaService = {
      inventoryItem: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'item-1',
            profileId: 'profile-1',
            itemSlug: 'wheat_seed',
            quantity: 5,
            item: {
              id: 'seed-1',
              slug: 'wheat_seed',
              name: 'Semente de Trigo',
              type: 'SEED',
              buyPrice: 10,
              sellPrice: 5,
              growthTime: 30,
              xpReward: 5,
              minLevel: 1,
              yieldItemSlug: 'wheat',
            },
          },
          {
            id: 'item-2',
            profileId: 'profile-1',
            itemSlug: 'carrot',
            quantity: 3,
            item: {
              id: 'crop-2',
              slug: 'carrot',
              name: 'Cenoura',
              type: 'CROP',
              buyPrice: 0,
              sellPrice: 80,
              xpReward: 15,
            },
          },
        ]),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      item: {
        findUnique: jest.fn(),
      },
      profile: {
        update: jest.fn().mockResolvedValue({ id: 'profile-1', coins: 150 }),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    mockUsersService = {
      getUserProfile: jest.fn().mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        coins: 100,
        level: 1,
      }),
    };

    mockActivityService = {
      logEarnCoins: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ActivityService, useValue: mockActivityService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return enriched user inventory with calculated total items and prices', async () => {
    const result = await service.getUserInventory('user-1');

    expect(result.totalItems).toBe(8); // 5 wheat seeds + 3 carrots
    expect(result.items).toHaveLength(2);

    const seedItem = result.items[0];
    expect(seedItem.name).toBe('Semente de Trigo');
    expect(seedItem.itemType).toBe('SEED');
    expect(seedItem.quantity).toBe(5);
    expect(seedItem.unitSellPrice).toBe(5);

    const cropItem = result.items[1];
    expect(cropItem.name).toBe('Cenoura');
    expect(cropItem.itemType).toBe('CROP');
    expect(cropItem.quantity).toBe(3);
    expect(cropItem.unitSellPrice).toBe(80);
    expect(cropItem.totalSellPrice).toBe(240);
  });

  it('should add item using upsert', async () => {
    mockPrismaService.item.findUnique.mockResolvedValue({
      slug: 'wheat_seed',
      name: 'Semente de Trigo',
    });
    mockPrismaService.inventoryItem.upsert.mockResolvedValue({
      id: 'item-1',
      profileId: 'profile-1',
      itemSlug: 'wheat_seed',
      quantity: 10,
    });

    const result = await service.addItem('profile-1', 'wheat_seed', 5);
    expect(result.quantity).toBe(10);
    expect(mockPrismaService.inventoryItem.upsert).toHaveBeenCalled();
  });

  it('should throw BadRequestException when adding non-positive quantity', async () => {
    await expect(service.addItem('profile-1', 'wheat_seed', 0)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should remove item and delete row when quantity reaches 0', async () => {
    mockPrismaService.inventoryItem.findUnique.mockResolvedValue({
      id: 'item-1',
      profileId: 'profile-1',
      itemSlug: 'wheat_seed',
      quantity: 5,
      item: { name: 'Semente de Trigo' },
    });

    const result = await service.removeItem('profile-1', 'wheat_seed', 5);
    expect(result.remainingQuantity).toBe(0);
    expect(mockPrismaService.inventoryItem.delete).toHaveBeenCalledWith({
      where: { id: 'item-1' },
    });
  });

  it('should remove partial quantity and update row', async () => {
    mockPrismaService.inventoryItem.findUnique.mockResolvedValue({
      id: 'item-1',
      profileId: 'profile-1',
      itemSlug: 'wheat_seed',
      quantity: 5,
      item: { name: 'Semente de Trigo' },
    });
    mockPrismaService.inventoryItem.update.mockResolvedValue({
      id: 'item-1',
      quantity: 2,
    });

    const result = await service.removeItem('profile-1', 'wheat_seed', 3);
    expect(result.remainingQuantity).toBe(2);
    expect(mockPrismaService.inventoryItem.update).toHaveBeenCalled();
  });

  it('should throw when trying to remove more items than available', async () => {
    mockPrismaService.inventoryItem.findUnique.mockResolvedValue({
      id: 'item-1',
      profileId: 'profile-1',
      itemSlug: 'wheat_seed',
      quantity: 2,
      item: { name: 'Semente de Trigo' },
    });

    await expect(service.removeItem('profile-1', 'wheat_seed', 5)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should sell items, update profile coins and log activity', async () => {
    mockPrismaService.inventoryItem.findUnique.mockResolvedValue({
      id: 'item-2',
      profileId: 'profile-1',
      itemSlug: 'carrot',
      quantity: 3,
      item: {
        slug: 'carrot',
        name: 'Cenoura',
        type: 'CROP',
        sellPrice: 80,
      },
    });
    mockPrismaService.inventoryItem.update.mockResolvedValue({
      id: 'item-2',
      quantity: 1,
    });

    const sellResult = await service.sellItem('user-1', 'carrot', 2);

    expect(sellResult.quantitySold).toBe(2);
    expect(sellResult.earnedCoins).toBe(160); // 2 * 80
    expect(sellResult.remainingQuantity).toBe(1);
    expect(mockActivityService.logEarnCoins).toHaveBeenCalledWith(
      'user-1',
      160,
      'Venda de 2x Cenoura',
      expect.anything(),
    );
  });
});
