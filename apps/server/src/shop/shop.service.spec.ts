import { Test, TestingModule } from '@nestjs/testing';
import { ShopService } from './shop.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

describe('ShopService', () => {
  let service: ShopService;
  let mockPrismaService: any;
  let mockUsersService: any;

  const mockSeeds = [
    {
      id: '1',
      name: 'Semente de Trigo',
      slug: 'wheat_seed',
      type: 'SEED',
      buyPrice: 10,
      sellPrice: 5,
      growthTime: 30,
      xpReward: 5,
      minLevel: 1,
      yieldItemSlug: 'wheat',
    },
    {
      id: '2',
      name: 'Semente de Cenoura',
      slug: 'carrot_seed',
      type: 'SEED',
      buyPrice: 30,
      sellPrice: 15,
      growthTime: 120,
      xpReward: 15,
      minLevel: 2,
      yieldItemSlug: 'carrot',
    },
    {
      id: '3',
      name: 'Semente de Milho',
      slug: 'corn_seed',
      type: 'SEED',
      buyPrice: 80,
      sellPrice: 40,
      growthTime: 300,
      xpReward: 40,
      minLevel: 5,
      yieldItemSlug: 'corn',
    },
  ];

  const mockAllItems = [
    ...mockSeeds,
    { id: '4', name: 'Trigo', slug: 'wheat', type: 'CROP', buyPrice: 0, sellPrice: 25, minLevel: 1 },
    { id: '5', name: 'Cenoura', slug: 'carrot', type: 'CROP', buyPrice: 0, sellPrice: 80, minLevel: 2 },
    { id: '6', name: 'Milho', slug: 'corn', type: 'CROP', buyPrice: 0, sellPrice: 220, minLevel: 5 },
  ];

  beforeEach(async () => {
    mockPrismaService = {
      item: {
        findMany: jest.fn().mockImplementation((args) => {
          if (args?.where?.type === 'SEED') {
            return Promise.resolve(mockSeeds);
          }
          return Promise.resolve(mockAllItems);
        }),
      },
    };

    mockUsersService = {
      getUserProfile: jest.fn().mockResolvedValue({
        id: 'profile-1',
        userId: 'user-1',
        level: 2,
        coins: 50,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<ShopService>(ShopService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate profits and coinsPerMinute without user based on yield item', async () => {
    const seeds = await service.getSeeds();

    expect(seeds).toHaveLength(3);
    // Trigo: profit = 25 (wheat sellPrice) - 10 (wheat_seed buyPrice) = 15; coinsPerMinute = (15 / 30) * 60 = 30
    expect(seeds[0]).toEqual({
      id: '1',
      name: 'Semente de Trigo',
      slug: 'wheat_seed',
      description: undefined,
      price: 10,
      sellPrice: 25,
      growthTime: 30,
      xpReward: 5,
      minLevel: 1,
      yieldItemSlug: 'wheat',
      profit: 15,
      coinsPerMinute: 30,
    });
  });

  it('should enrich seed items with user unlock and affordability status', async () => {
    const seeds = await service.getSeeds('user-1');

    // User is level 2, has 50 coins:
    // Trigo: minLevel 1 (unlocked), price 10 <= 50 (affordable)
    expect(seeds[0].isUnlocked).toBe(true);
    expect(seeds[0].canAfford).toBe(true);

    // Cenoura: minLevel 2 (unlocked), price 30 <= 50 (affordable)
    expect(seeds[1].isUnlocked).toBe(true);
    expect(seeds[1].canAfford).toBe(true);

    // Milho: minLevel 5 (locked for level 2), price 80 > 50 (not affordable)
    expect(seeds[2].isUnlocked).toBe(false);
    expect(seeds[2].canAfford).toBe(false);
  });

  it('should return catalog with seeds and placeholders for future categories', async () => {
    const catalog = await service.getCatalog('user-1');

    expect(catalog.categories.seeds).toHaveLength(3);
    expect(catalog.categories.fertilizers).toEqual([]);
    expect(catalog.categories.tools).toEqual([]);
    expect(catalog.serverTime).toBeDefined();
  });
});
