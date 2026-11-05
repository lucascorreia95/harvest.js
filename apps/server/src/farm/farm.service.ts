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

    const now = new Date();

    // Retorna os plots formatados, preservando compatibilidade com o front
    const formattedPlots = plots.map((plot) => {
      // Verifica se está úmido
      let isWatered = false;
      if (plot.wateredAt && plot.crop) {
        const waterDuration = plot.crop.waterDuration || 0;
        const wateredAt = new Date(plot.wateredAt);
        const timeSinceWatered = Math.floor((now.getTime() - wateredAt.getTime()) / 1000);
        isWatered = timeSinceWatered < waterDuration;
      }

      // Calcula tempo de crescimento efetivo com bônus de rega e penalidade de peste
      let effectiveGrowthTime = plot.crop?.growthTime;
      if (plot.crop) {
        // Bônus de rega
        let timeBonus = 0;
        if (plot.waterCount > 0) {
          const waterTimeBonus = plot.crop.waterTimeBonus || 0;
          timeBonus = plot.waterCount * waterTimeBonus;
        }

        // Penalidade de peste (+50% do tempo)
        let pestPenalty = 0;
        if (plot.willHavePest && !plot.pestRemoved && plot.pestAppearTime) {
          const pestAppearTime = new Date(plot.pestAppearTime);
          if (now >= pestAppearTime) {
            pestPenalty = Math.floor((plot.crop.growthTime || 0) * 0.5);
          }
        }

        effectiveGrowthTime = Math.max(0, (plot.crop.growthTime || 0) - timeBonus + pestPenalty);
      }

      return {
        index: plot.index,
        isUnlocked: plot.isUnlocked,
        crop: plot.crop ? {
          slug: plot.crop.yieldItemSlug || plot.crop.slug,
          itemSlug: plot.crop.slug,
          growthTime: plot.crop.growthTime,
          effectiveGrowthTime,
          plantedAt: plot.plantedAt,
          isWatered,
          waterCount: plot.waterCount || 0,
          willHavePest: plot.willHavePest || false,
          pestAppearTime: plot.pestAppearTime,
          pestRemoved: plot.pestRemoved || false,
        } : null,
      };
    });

    return {
      serverTime: now.toISOString(),
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
      // Verifica e debita moedas com trava de concorrência
      const updatedProfile = await tx.profile.update({
        where: {
          id: profile.id,
          coins: { gte: unlockCost },
        },
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
      const now = new Date();
      const willHavePest = Math.random() < 0.35; // 35% chance de ter peste
      const growthTime = seedItem.growthTime || 0;
      const pestAppearTime = willHavePest
        ? new Date(now.getTime() + (growthTime / 2) * 1000)
        : null;

      const updatedPlot = await tx.plot.update({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        data: {
          cropType: seedItem.slug,
          plantedAt: now,
          wateredAt: null,
          waterCount: 0,
          willHavePest,
          pestAppearTime,
          pestRemoved: false,
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

      // Recalcula tempo efetivo dentro da transação com estado atual (race condition fix)
      const baseGrowthTime = currentPlot.crop.growthTime || 0;
      const waterTimeBonus = currentPlot.crop.waterTimeBonus || 0;
      const waterCount = currentPlot.waterCount || 0;
      const timeBonus = waterCount * waterTimeBonus;

      // Penalidade de peste (+50% do tempo)
      let pestPenalty = 0;
      if (currentPlot.willHavePest && !currentPlot.pestRemoved && currentPlot.pestAppearTime) {
        const pestAppearTime = new Date(currentPlot.pestAppearTime);
        const now = new Date();
        if (now >= pestAppearTime) {
          pestPenalty = Math.floor(baseGrowthTime * 0.5);
        }
      }

      const effectiveGrowthTime = Math.max(0, baseGrowthTime - timeBonus + pestPenalty);

      const now = new Date();
      const plantedAt = new Date(currentPlot.plantedAt);
      const timeDiff = Math.floor((now.getTime() - plantedAt.getTime()) / 1000);

      if (timeDiff < effectiveGrowthTime) {
        const remainingTime = effectiveGrowthTime - timeDiff;
        throw new BadRequestException(
          `Crop not ready. Remaining time: ${remainingTime} seconds.`
        );
      }

      // Descobre o fruto colhido correspondente à semente
      const yieldSlug = currentPlot.crop.yieldItemSlug || currentPlot.crop.slug;
      const yieldItem = await tx.item.findUnique({
        where: { slug: yieldSlug },
      });

      const harvestedName = yieldItem?.name || currentPlot.crop.name;

      // Adiciona o fruto colhido ao inventário do jogador!
      await this.inventoryService.addItem(profile.id, yieldSlug, 1, tx);

      // Calcula XP considerando bônus de rega
      const baseXp = currentPlot.crop.xpReward || 0;
      const waterXpBonus = currentPlot.crop.waterXpBonus || 0;
      const waterXpTotal = waterCount * waterXpBonus;
      const totalXp = baseXp + waterXpTotal;

      // Log de ganho de XP
      await this.activityService.logEarnXp(
        userId,
        totalXp,
        `Colheita de ${harvestedName} no Plot ${plotIndex} (regado ${waterCount}x)`,
        tx,
      );

      // Adiciona experiência usando ExperienceService
      const experienceResult = await this.experienceService.addExperience(profile.id, totalXp, tx);

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
          wateredAt: null,
          waterCount: 0,
          willHavePest: false,
          pestAppearTime: null,
          pestRemoved: false,
        },
        include: { crop: true },
      });

      // Log da atividade de colheita
      await this.activityService.logHarvesting(
        userId,
        harvestedName,
        plotIndex,
        yieldItem?.sellPrice || 0,
        totalXp,
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
        harvestedItem: yieldItem || currentPlot.crop,
        harvestedCrop: yieldItem || currentPlot.crop, // compatibilidade com clientes anteriores
        earnedXp: totalXp,
        plot: clearedPlot,
        newExperience: experienceResult.newExperience,
        levelUp: experienceResult.levelUp,
        newLevel: experienceResult.newLevel,
        levelsGained: experienceResult.levelsGained,
      };
    });
  }

  async waterPlot(userId: string, plotIndex: number) {
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
      throw new BadRequestException('This plot has no crop to water.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Verifica se está úmido dentro da transação (race condition)
      const currentPlot = await tx.plot.findUnique({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        include: { crop: true },
      });

      if (!currentPlot || !currentPlot.crop) {
        throw new BadRequestException('Crop not found.');
      }

      // Verifica se está úmido
      if (currentPlot.wateredAt && currentPlot.crop) {
        const waterDuration = currentPlot.crop.waterDuration || 0;
        const wateredAt = new Date(currentPlot.wateredAt);
        const now = new Date();
        const timeSinceWatered = Math.floor((now.getTime() - wateredAt.getTime()) / 1000);

        if (timeSinceWatered < waterDuration) {
          throw new BadRequestException('Esta planta já está úmida.');
        }
      }

      const now = new Date();
      const updatedPlot = await tx.plot.update({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        data: {
          wateredAt: now,
          waterCount: { increment: 1 },
        },
        include: { crop: true },
      });

      // XP por regar (fixo 1 XP)
      await this.experienceService.addExperience(profile.id, 1, tx);

      // Log da atividade
      const user = await this.usersService.findById(userId);
      await this.activityService.logActivity(
        userId,
        'water',
        `${user?.username || 'Unknown'} regou ${plot.crop.name} no Plot ${plotIndex}`,
        { plotIndex, cropSlug: plot.crop.slug, cropName: plot.crop.name },
        tx,
      );

      return {
        plot: updatedPlot,
        wateredAt: now.toISOString(),
        waterCount: updatedPlot.waterCount,
      };
    });
  }

  async sprayPlot(userId: string, plotIndex: number) {
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
      throw new BadRequestException('This plot has no crop to spray.');
    }

    if (!plot.willHavePest) {
      throw new BadRequestException('This plot does not have a pest.');
    }

    if (plot.pestRemoved) {
      throw new BadRequestException('Pest has already been removed.');
    }

    const now = new Date();
    if (plot.pestAppearTime && now < new Date(plot.pestAppearTime)) {
      throw new BadRequestException('Pest has not appeared yet.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Verifica novamente dentro da transação (race condition)
      const currentPlot = await tx.plot.findUnique({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        include: { crop: true },
      });

      if (!currentPlot || !currentPlot.crop) {
        throw new BadRequestException('Crop not found.');
      }

      if (!currentPlot.willHavePest || currentPlot.pestRemoved) {
        throw new BadRequestException('Pest has already been removed or does not exist.');
      }

      const updatedPlot = await tx.plot.update({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        data: {
          pestRemoved: true,
        },
        include: { crop: true },
      });

      // XP por remover peste (fixo 2 XP)
      await this.experienceService.addExperience(profile.id, 2, tx);

      // Log da atividade
      const user = await this.usersService.findById(userId);
      await this.activityService.logActivity(
        userId,
        'spray',
        `${user?.username || 'Unknown'} removeu peste de ${plot.crop.name} no Plot ${plotIndex}`,
        { plotIndex, cropSlug: plot.crop.slug, cropName: plot.crop.name },
        tx,
      );

      return {
        plot: updatedPlot,
        pestRemoved: true,
      };
    });
  }
}
