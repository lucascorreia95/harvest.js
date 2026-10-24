import { Test, TestingModule } from '@nestjs/testing';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

describe('ShopController', () => {
  let controller: ShopController;
  let mockShopService: any;

  beforeEach(async () => {
    mockShopService = {
      getSeeds: jest.fn().mockResolvedValue([
        { id: '1', name: 'Trigo', slug: 'wheat' },
      ]),
      getCatalog: jest.fn().mockResolvedValue({
        serverTime: '2026-10-22T00:00:00Z',
        categories: { seeds: [], fertilizers: [], tools: [] },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopController],
      providers: [
        { provide: ShopService, useValue: mockShopService },
      ],
    }).compile();

    controller = module.get<ShopController>(ShopController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get seeds with user sub', async () => {
    const req = { user: { sub: 'user-123' } };
    const result = await controller.getSeeds(req);
    expect(mockShopService.getSeeds).toHaveBeenCalledWith('user-123');
    expect(result).toHaveLength(1);
  });

  it('should get catalog with user sub', async () => {
    const req = { user: { sub: 'user-123' } };
    const result = await controller.getCatalog(req);
    expect(mockShopService.getCatalog).toHaveBeenCalledWith('user-123');
    expect(result.categories).toBeDefined();
  });
});
