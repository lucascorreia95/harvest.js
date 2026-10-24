import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ShopService } from './shop.service';
import { ShopItemDto, ShopCatalogResponseDto, BuyItemDto, BuyItemResponseDto } from './dto/shop.dto';

@Controller('shop')
@UseGuards(JwtAuthGuard)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  async getItems(
    @Req() req,
    @Query('type') filterType?: string,
  ): Promise<ShopItemDto[]> {
    const userId = req.user?.sub || req.user?.userId;
    return this.shopService.getItems(userId, filterType);
  }

  @Get('catalog')
  async getCatalog(@Req() req): Promise<ShopCatalogResponseDto> {
    const userId = req.user?.sub || req.user?.userId;
    return this.shopService.getCatalog(userId);
  }

  @Get('seeds')
  async getSeeds(@Req() req): Promise<ShopItemDto[]> {
    const userId = req.user?.sub || req.user?.userId;
    return this.shopService.getSeeds(userId);
  }

  @Post('buy')
  async buyItem(
    @Req() req,
    @Body() buyItemDto: BuyItemDto,
  ): Promise<BuyItemResponseDto> {
    const userId = req.user?.sub || req.user?.userId;
    return this.shopService.buyItem(userId, buyItemDto.itemSlug, buyItemDto.quantity);
  }
}
