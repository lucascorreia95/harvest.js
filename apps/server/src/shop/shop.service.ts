import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { InventoryService } from '../inventory/inventory.service';
import { ActivityService } from '../activity/activity.service';
import { ShopItemDto, ShopCatalogResponseDto, BuyItemResponseDto } from './dto/shop.dto';

@Injectable()
export class ShopService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private inventoryService: InventoryService,
    private activityService: ActivityService,
  ) {}

  /**
   * Retorna os itens disponíveis na loja.
   * Regra: Um item está à venda se, e somente se, buyPrice > 0.
   * O filtro por tipo/categoria é opcional para ser usado na UI (ex: ?type=SEED).
   */
  async getItems(userId?: string, filterType?: string): Promise<ShopItemDto[]> {
    const whereClause: any = {
      buyPrice: { gt: 0 },
    };

    if (filterType) {
      whereClause.type = filterType.toUpperCase();
    }

    const [shopItems, allItems] = await Promise.all([
      this.prisma.item.findMany({
        where: whereClause,
        orderBy: [
          { type: 'asc' },
          { minLevel: 'asc' },
          { buyPrice: 'asc' },
        ],
      }),
      this.prisma.item.findMany(),
    ]);

    const itemsMap = new Map(allItems.map((i) => [i.slug, i]));

    let profile: { level: number; coins: number } | null = null;
    if (userId) {
      try {
        profile = await this.usersService.getUserProfile(userId);
      } catch {
        profile = null;
      }
    }

    return shopItems.map((item) => {
      let profit: number | undefined = undefined;
      let coinsPerMinute: number | undefined = undefined;

      if (item.type === 'SEED') {
        const yieldCrop = item.yieldItemSlug ? itemsMap.get(item.yieldItemSlug) : null;
        const sellPrice = yieldCrop ? yieldCrop.sellPrice : item.sellPrice;
        profit = sellPrice - item.buyPrice;
        const growthTime = item.growthTime || 0;
        coinsPerMinute = growthTime > 0
          ? Math.round(((profit / growthTime) * 60) * 100) / 100
          : 0;
      }

      return {
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description || undefined,
        type: item.type,
        price: item.buyPrice,
        sellPrice: item.sellPrice,
        minLevel: item.minLevel,
        growthTime: item.growthTime || undefined,
        xpReward: item.xpReward || undefined,
        yieldItemSlug: item.yieldItemSlug || undefined,
        profit,
        coinsPerMinute,
        ...(profile
          ? {
              isUnlocked: profile.level >= item.minLevel,
              canAfford: profile.coins >= item.buyPrice,
            }
          : {}),
      };
    });
  }

  /**
   * Atalho para buscar sementes da loja.
   */
  async getSeeds(userId?: string): Promise<ShopItemDto[]> {
    return this.getItems(userId, 'SEED');
  }

  /**
   * Retorna o catálogo completo da loja agrupado dinamicamente por tipo.
   * Não há categorias hardcoded: qualquer novo tipo com buyPrice > 0 aparece automaticamente.
   */
  async getCatalog(userId?: string): Promise<ShopCatalogResponseDto> {
    const items = await this.getItems(userId);

    const categories: Record<string, ShopItemDto[]> = {};
    for (const item of items) {
      if (!categories[item.type]) {
        categories[item.type] = [];
      }
      categories[item.type].push(item);
    }

    const availableTypes = Object.keys(categories);

    return {
      serverTime: new Date().toISOString(),
      totalItems: items.length,
      availableTypes,
      categories,
    };
  }

  /**
   * Compra qualquer item da loja (sementes, fertilizantes, ferramentas, etc.),
   * debitando moedas e adicionando ao inventário.
   */
  async buyItem(userId: string, itemSlug: string, quantity: number): Promise<BuyItemResponseDto> {
    if (quantity <= 0) {
      throw new BadRequestException('A quantidade a comprar deve ser maior que zero.');
    }

    const item = await this.prisma.item.findUnique({
      where: { slug: itemSlug },
    });

    if (!item) {
      throw new NotFoundException(`Item não encontrado no catálogo: ${itemSlug}`);
    }

    if (item.buyPrice <= 0) {
      throw new BadRequestException(`O item ${item.name} não está à venda na loja.`);
    }

    const profile = await this.usersService.getUserProfile(userId);

    if (profile.level < item.minLevel) {
      throw new BadRequestException(
        `Nível insuficiente para comprar ${item.name}. Necessário nível: ${item.minLevel}, seu nível: ${profile.level}`,
      );
    }

    const totalCost = item.buyPrice * quantity;

    if (profile.coins < totalCost) {
      throw new BadRequestException(
        `Moedas insuficientes. Custo total: ${totalCost} moedas, saldo atual: ${profile.coins} moedas.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Debita moedas com trava de concorrência
      const updatedProfile = await tx.profile.update({
        where: {
          id: profile.id,
          coins: { gte: totalCost },
        },
        data: {
          coins: { decrement: totalCost },
        },
      });

      // Adiciona ao inventário
      const invItem = await this.inventoryService.addItem(profile.id, item.slug, quantity, tx);

      // Registra nos logs de auditoria
      await this.activityService.logSpendCoins(
        userId,
        totalCost,
        `Compra de ${quantity}x ${item.name} na loja`,
        tx,
      );

      return {
        itemSlug: item.slug,
        itemName: item.name,
        itemType: item.type,
        quantityBought: quantity,
        unitPrice: item.buyPrice,
        totalCost,
        remainingCoins: updatedProfile.coins,
        inventoryItem: {
          id: invItem.id,
          itemSlug: invItem.itemSlug,
          quantity: invItem.quantity,
        },
      };
    });
  }
}
