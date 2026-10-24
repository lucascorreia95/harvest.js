import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ActivityService } from '../activity/activity.service';
import {
  InventoryItemType,
  InventoryResponseDto,
  InventoryItemDetailDto,
  SellItemResponseDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private activityService: ActivityService,
  ) {}

  /**
   * Retorna os itens do inventário do usuário logado diretamente da relação com Item,
   * trazendo nomes, valores, metadados e quantidades em uma única consulta.
   */
  async getUserInventory(userId: string, filterType?: InventoryItemType): Promise<InventoryResponseDto> {
    const profile = await this.usersService.getUserProfile(userId);

    const whereClause: any = {
      profileId: profile.id,
      quantity: { gt: 0 },
    };

    if (filterType) {
      whereClause.item = { type: filterType };
    }

    const items = await this.prisma.inventoryItem.findMany({
      where: whereClause,
      include: { item: true },
      orderBy: [
        { item: { type: 'asc' } },
        { itemSlug: 'asc' },
      ],
    });

    const enrichedItems: InventoryItemDetailDto[] = items.map((invItem) => {
      const itemDef = invItem.item;
      let details: any = undefined;

      if (itemDef.type === 'SEED') {
        details = {
          growthTime: itemDef.growthTime || 0,
          xpReward: itemDef.xpReward || 0,
          minLevel: itemDef.minLevel,
          yieldItemSlug: itemDef.yieldItemSlug || undefined,
        };
      } else if (itemDef.type === 'CROP') {
        details = {
          xpReward: itemDef.xpReward || 0,
        };
      }

      return {
        id: invItem.id,
        itemSlug: invItem.itemSlug,
        itemType: itemDef.type,
        name: itemDef.name,
        description: itemDef.description || undefined,
        quantity: invItem.quantity,
        unitBuyPrice: itemDef.buyPrice,
        unitSellPrice: itemDef.sellPrice,
        totalSellPrice: itemDef.sellPrice * invItem.quantity,
        details,
      };
    });

    const totalItems = enrichedItems.reduce((acc, curr) => acc + curr.quantity, 0);

    return {
      serverTime: new Date().toISOString(),
      totalItems,
      items: enrichedItems,
    };
  }

  /**
   * Adiciona um item ao inventário do perfil (ou incrementa a quantidade).
   * Executável dentro de uma transação existente.
   */
  async addItem(
    profileId: string,
    itemSlug: string,
    quantity: number,
    tx?: any,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('A quantidade a adicionar deve ser maior que zero.');
    }

    const db = tx || this.prisma;

    // Garante que o item existe no catálogo
    const itemDef = await db.item.findUnique({
      where: { slug: itemSlug },
    });

    if (!itemDef) {
      throw new NotFoundException(`Item não encontrado no catálogo: ${itemSlug}`);
    }

    return db.inventoryItem.upsert({
      where: {
        profileId_itemSlug: {
          profileId,
          itemSlug,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        profileId,
        itemSlug,
        quantity,
      },
    });
  }

  /**
   * Remove uma quantidade de item do inventário do perfil.
   * Se a quantidade chegar a 0, remove o registro da tabela para manter a base limpa.
   * Executável dentro de uma transação existente.
   */
  async removeItem(
    profileId: string,
    itemSlug: string,
    quantity: number,
    tx?: any,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('A quantidade a remover deve ser maior que zero.');
    }

    const db = tx || this.prisma;

    const existing = await db.inventoryItem.findUnique({
      where: {
        profileId_itemSlug: {
          profileId,
          itemSlug,
        },
      },
      include: { item: true },
    });

    if (!existing || existing.quantity < quantity) {
      throw new BadRequestException(
        `Quantidade insuficiente de ${existing?.item?.name || itemSlug} no inventário. Possui: ${existing?.quantity || 0}, Solicitado: ${quantity}`,
      );
    }

    if (existing.quantity === quantity) {
      await db.inventoryItem.delete({
        where: { id: existing.id },
      });
      return { id: existing.id, remainingQuantity: 0 };
    }

    const updated = await db.inventoryItem.update({
      where: { id: existing.id },
      data: {
        quantity: { decrement: quantity },
      },
    });

    return { id: updated.id, remainingQuantity: updated.quantity };
  }

  /**
   * Verifica se o perfil tem uma quantidade específica de um item.
   */
  async hasItem(
    profileId: string,
    itemSlug: string,
    quantity: number = 1,
    tx?: any,
  ): Promise<boolean> {
    const db = tx || this.prisma;
    const item = await db.inventoryItem.findUnique({
      where: {
        profileId_itemSlug: {
          profileId,
          itemSlug,
        },
      },
    });

    return !!item && item.quantity >= quantity;
  }

  /**
   * Vende itens do inventário (ex: frutos colhidos ou sementes),
   * creditando as moedas no perfil do jogador e registrando nos logs.
   */
  async sellItem(
    userId: string,
    itemSlug: string,
    quantity: number,
  ): Promise<SellItemResponseDto> {
    if (quantity <= 0) {
      throw new BadRequestException('A quantidade a vender deve ser maior que zero.');
    }

    const profile = await this.usersService.getUserProfile(userId);

    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: {
        profileId_itemSlug: {
          profileId: profile.id,
          itemSlug,
        },
      },
      include: { item: true },
    });

    if (!inventoryItem || inventoryItem.quantity < quantity) {
      throw new BadRequestException(
        `Quantidade insuficiente de ${inventoryItem?.item?.name || itemSlug} para vender. Possui: ${inventoryItem?.quantity || 0}, Solicitado: ${quantity}`,
      );
    }

    const itemDef = inventoryItem.item;
    if (itemDef.sellPrice <= 0) {
      throw new BadRequestException(`O item ${itemDef.name} não possui valor de venda.`);
    }

    const totalEarned = itemDef.sellPrice * quantity;

    return this.prisma.$transaction(async (tx) => {
      // Remove do inventário
      const removeResult = await this.removeItem(profile.id, itemSlug, quantity, tx);

      // Credita moedas
      const updatedProfile = await tx.profile.update({
        where: { id: profile.id },
        data: {
          coins: { increment: totalEarned },
        },
      });

      // Registra nos logs de atividade
      await this.activityService.logEarnCoins(
        userId,
        totalEarned,
        `Venda de ${quantity}x ${itemDef.name}`,
        tx,
      );

      return {
        itemSlug,
        itemName: itemDef.name,
        itemType: itemDef.type,
        quantitySold: quantity,
        unitPrice: itemDef.sellPrice,
        earnedCoins: totalEarned,
        remainingQuantity: removeResult.remainingQuantity,
        newTotalCoins: updatedProfile.coins,
      };
    });
  }
}
