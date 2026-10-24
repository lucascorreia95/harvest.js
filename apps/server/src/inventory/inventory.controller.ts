import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InventoryService } from './inventory.service';
import { InventoryItemType, SellItemDto } from './dto/inventory.dto';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getInventory(
    @Req() req,
    @Query('type') filterType?: InventoryItemType,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.inventoryService.getUserInventory(userId, filterType);
  }

  @Post('sell')
  async sellItem(
    @Req() req,
    @Body() sellItemDto: SellItemDto,
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.inventoryService.sellItem(
      userId,
      sellItemDto.itemSlug,
      sellItemDto.quantity,
    );
  }
}
