import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ExperienceService } from '../experience/experience.service';
import { ActivityService } from '../activity/activity.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class FarmService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private experienceService: ExperienceService,
    private activityService: ActivityService,
    private inventoryService: InventoryService,
  ) {}

  async getFarmState(userId: string) {
    const profile = await this.usersService.getUserProfile(userId);
    const plots = await this.prisma.plot.findMany({
      where: { profileId: profile.id },
      include: { crop: true },
      orderBy: { index: 'asc' },
    });

    // Retorna os plots formatados, preservando compatibilidade com o front
    const formattedPlots = plots.map((plot) => ({
      index: plot.index,
      isUnlocked: plot.isUnlocked,
      crop: plot.crop ? {
        slug: plot.crop.yieldItemSlug || plot.crop.slug, // ex: 'wheat' para renderizar sprite
        itemSlug: plot.crop.slug, // ex: 'wheat_seed'
        growthTime: plot.crop.growthTime,
        plantedAt: plot.plantedAt,
      } : null,
    }));

    return {
      serverTime: new Date().toISOString(),
      plots: formattedPlots,
    };
  }

  async unlockPlot(userId: string, plotIndex: number) {
    if (plotIndex < 0 || plotIndex > 27) {
      throw new BadRequestException('Invalid plot index. Must be between 0 and 27.');
    }

    const profile = await this.usersService.getUserProfile(userId);

    // Preço para desbloquear: 50 + (plotIndex * 20)
    const unlockCost = 50 + (plotIndex * 20);

    if (profile.coins < unlockCost) {
      throw new BadRequestException(`Insufficient coins. Required: ${unlockCost}`);
    }

    const existingPlot = await this.prisma.plot.findUnique({
      where: {
        profileId_index: {
          profileId: profile.id,
          index: plotIndex,
        },
      },
    });

    if (existingPlot && existingPlot.isUnlocked) {
      throw new BadRequestException('This plot is already unlocked.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Desconta moedas
      await tx.profile.update({
        where: { id: profile.id },
        data: {
          coins: {
            decrement: unlockCost,
          },
        },
      });

      // Cria ou atualiza o plot
      const plot = await tx.plot.upsert({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        update: {
          isUnlocked: true,
        },
        create: {
          profileId: profile.id,
          index: plotIndex,
          isUnlocked: true,
        },
      });

      // Log da atividade
      await this.activityService.logUnlockPlot(userId, plotIndex, unlockCost, tx);

      return plot;
    });
  }

  async plantCrop(userId: string, plotIndex: number, cropSlug: string) {
    // Busca a semente pelo slug direto (ex: 'wheat_seed') ou pelo yield (ex: 'wheat')
    const seedItem = await this.prisma.item.findFirst({
      where: {
        type: 'SEED',
        OR: [
          { slug: cropSlug },
          { yieldItemSlug: cropSlug },
        ],
      },
    });

    if (!seedItem) {
      throw new NotFoundException(`Semente não encontrada no catálogo para: ${cropSlug}`);
    }

    const profile = await this.usersService.getUserProfile(userId);

    if (profile.level < seedItem.minLevel) {
      throw new BadRequestException(`Nível insuficiente. Necessário: ${seedItem.minLevel}`);
    }

    const hasSeedInInventory = await this.inventoryService.hasItem(
      profile.id,
      seedItem.slug,
      1,
    );

    if (!hasSeedInInventory && profile.coins < seedItem.buyPrice) {
      throw new BadRequestException(
        `Você não possui ${seedItem.name} no inventário e não possui moedas suficientes (${seedItem.buyPrice}) para compra direta.`,
      );
    }

    const plot = await this.prisma.plot.findUnique({
      where: {
        profileId_index: {
          profileId: profile.id,
          index: plotIndex,
        },
      },
    });

    if (!plot || !plot.isUnlocked) {
      throw new BadRequestException('Plot does not exist or is not unlocked.');
    }

    if (plot.cropType) {
      throw new BadRequestException('This plot is already planted.');
    }

    return this.prisma.$transaction(async (tx) => {
      let remainingCoins = profile.coins;

      if (hasSeedInInventory) {
        // Consome 1 semente do inventário
        await this.inventoryService.removeItem(profile.id, seedItem.slug, 1, tx);
      } else {
        // Compra direta se não tiver a semente no inventário
        const profileUpdate = await tx.profile.update({
          where: { 
            id: profile.id,
            coins: { gte: seedItem.buyPrice },
          },
          data: {
            coins: {
              decrement: seedItem.buyPrice,
            },
          },
        });
        remainingCoins = profileUpdate.coins;

        // Log da compra direta de semente ao plantar
        await this.activityService.logSpendCoins(
          userId,
          seedItem.buyPrice,
          `Compra direta de 1x ${seedItem.name} ao plantar no Plot ${plotIndex}`,
          tx,
        );
      }

      // Planta a semente
      const updatedPlot = await tx.plot.update({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        data: {
          cropType: seedItem.slug,
          plantedAt: new Date(),
        },
        include: { crop: true },
      });

      // Log da atividade
      await this.activityService.logPlanting(userId, seedItem.name, plotIndex, seedItem.slug, seedItem.buyPrice, tx);

      return {
        plot: updatedPlot,
        remainingCoins,
      };
    });
  }

  async harvestCrop(userId: string, plotIndex: number) {
    const profile = await this.usersService.getUserProfile(userId);
    
    const plot = await this.prisma.plot.findUnique({
      where: {
        profileId_index: {
          profileId: profile.id,
          index: plotIndex,
        },
      },
      include: { crop: true },
    });

    if (!plot || !plot.isUnlocked) {
      throw new BadRequestException('Plot does not exist or is not unlocked.');
    }

    if (!plot.cropType || !plot.crop) {
      throw new BadRequestException('This plot has no crop to harvest.');
    }

    if (!plot.plantedAt) {
      throw new BadRequestException('Planting date not found.');
    }

    const growthTime = plot.crop.growthTime || 0;
    const now = new Date();
    const plantedAt = new Date(plot.plantedAt);
    const timeDiff = Math.floor((now.getTime() - plantedAt.getTime()) / 1000);

    if (timeDiff < growthTime) {
      const remainingTime = growthTime - timeDiff;
      throw new BadRequestException(
        `Crop not ready. Remaining time: ${remainingTime} seconds.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Evita colheitas duplicadas em caso de race conditions
      const currentPlot = await tx.plot.findUnique({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        include: { crop: true },
      });

      if (!currentPlot || !currentPlot.cropType || !currentPlot.crop) {
        throw new BadRequestException('This plot has no crop to harvest.');
      }

      if (currentPlot.cropType !== plot.cropType ||
          currentPlot.plantedAt?.getTime() !== plot.plantedAt?.getTime()) {
        throw new BadRequestException('Crop state has changed. Please try again.');
      }

      // Descobre o fruto colhido correspondente à semente
      const yieldSlug = plot.crop.yieldItemSlug || plot.crop.slug;
      const yieldItem = await tx.item.findUnique({
        where: { slug: yieldSlug },
      });

      const harvestedName = yieldItem?.name || plot.crop.name;

      // Adiciona o fruto colhido ao inventário do jogador!
      await this.inventoryService.addItem(profile.id, yieldSlug, 1, tx);

      // Adiciona experiência usando ExperienceService
      const xpAmount = plot.crop.xpReward || 0;
      const experienceResult = await this.experienceService.addExperience(profile.id, xpAmount, tx);

      // Log de ganho de XP
      await this.activityService.logEarnXp(
        userId,
        xpAmount,
        `Colheita de ${harvestedName} no Plot ${plotIndex}`,
        tx,
      );

      // Limpa o plot
      const clearedPlot = await tx.plot.update({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        data: {
          cropType: null,
          plantedAt: null,
        },
        include: { crop: true },
      });

      // Log da atividade de colheita
      await this.activityService.logHarvesting(
        userId,
        harvestedName,
        plotIndex,
        yieldItem?.sellPrice || 0,
        xpAmount,
        tx,
      );

      // Log de level up se ocorreu
      if (experienceResult.levelUp) {
        await this.activityService.logLevelUp(
          userId,
          experienceResult.newLevel,
          experienceResult.newLevel - experienceResult.levelsGained,
          tx,
        );
      }

      return {
        harvestedItem: yieldItem || plot.crop,
        harvestedCrop: yieldItem || plot.crop, // compatibilidade com clientes anteriores
        earnedXp: xpAmount,
        plot: clearedPlot,
        newExperience: experienceResult.newExperience,
        levelUp: experienceResult.levelUp,
        newLevel: experienceResult.newLevel,
        levelsGained: experienceResult.levelsGained,
      };
    });
  }
}
