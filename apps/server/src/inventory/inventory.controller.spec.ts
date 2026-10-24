import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

describe('InventoryController', () => {
  let controller: InventoryController;
  let mockInventoryService: any;

  beforeEach(async () => {
    mockInventoryService = {
      getUserInventory: jest.fn().mockResolvedValue({
        serverTime: '2026-10-24T00:00:00Z',
        totalItems: 5,
        items: [],
      }),
      sellItem: jest.fn().mockResolvedValue({
        itemSlug: 'wheat',
        itemName: 'Trigo',
        itemType: 'CROP',
        quantitySold: 2,
        unitPrice: 25,
        earnedCoins: 50,
        remainingQuantity: 0,
        newTotalCoins: 150,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get user inventory', async () => {
    const req = { user: { sub: 'user-1' } };
    const result = await controller.getInventory(req);
    expect(mockInventoryService.getUserInventory).toHaveBeenCalledWith('user-1', undefined);
    expect(result.totalItems).toBe(5);
  });

  it('should pass filter type when provided', async () => {
    const req = { user: { sub: 'user-1' } };
    await controller.getInventory(req, 'SEED');
    expect(mockInventoryService.getUserInventory).toHaveBeenCalledWith('user-1', 'SEED');
  });

  it('should sell item from inventory', async () => {
    const req = { user: { sub: 'user-1' } };
    const result = await controller.sellItem(req, {
      itemSlug: 'wheat',
      quantity: 2,
    });
    expect(mockInventoryService.sellItem).toHaveBeenCalledWith('user-1', 'wheat', 2);
    expect(result.earnedCoins).toBe(50);
  });
});
