import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ExperienceService } from '../experience/experience.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class FarmService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private experienceService: ExperienceService,
    private activityService: ActivityService
  ) {}


  async getFarmState(userId: string) {
    const profile = await this.usersService.getUserProfile(userId);
    const plots = await this.prisma.plot.findMany({
      where: { profileId: profile.id },
      include: { crop: true },
      orderBy: { index: 'asc' },
    });

    // Retorna apenas os plots que existem no banco
    // Inicialmente serão 6 (0-5), e aumentará conforme o usuário for desbloqueando
    const formattedPlots = plots.map((plot) => ({
      index: plot.index,
      isUnlocked: plot.isUnlocked,
      crop: plot.crop ? {
        slug: plot.crop.slug,
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
    const crop = await this.prisma.crop.findUnique({
      where: { slug: cropSlug },
    });

    if (!crop) {
      throw new NotFoundException('Crop not found.');
    }

    const profile = await this.usersService.getUserProfile(userId);

    if (profile.level < crop.minLevel) {
      throw new BadRequestException(`Insufficient level. Required: ${crop.minLevel}`);
    }

    if (profile.coins < crop.price) {
      throw new BadRequestException(`Insufficient coins. Required: ${crop.price}`);
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
      // Prevenção de race condition: garante que o saldo ainda é suficiente
      const profileUpdate = await tx.profile.update({
        where: { 
          id: profile.id,
          coins: { gte: crop.price } // Só atualiza se ainda tiver moedas suficientes
        },
        data: {
          coins: {
            decrement: crop.price,
          },
        },
      });

      // Planta a semente
      const updatedPlot = await tx.plot.update({
        where: {
          profileId_index: {
            profileId: profile.id,
            index: plotIndex,
          },
        },
        data: {
          cropType: cropSlug,
          plantedAt: new Date(),
        },
        include: { crop: true },
      });

      // Log da atividade
      await this.activityService.logPlanting(userId, crop.name, plotIndex, cropSlug, crop.price, tx);

      return {
        plot: updatedPlot,
        remainingCoins: profileUpdate.coins,
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

    const now = new Date();
    const plantedAt = new Date(plot.plantedAt);
    const timeDiff = Math.floor((now.getTime() - plantedAt.getTime()) / 1000);

    if (timeDiff < plot.crop.growthTime) {
      const remainingTime = plot.crop.growthTime - timeDiff;
      throw new BadRequestException(
        `Crop not ready. Remaining time: ${remainingTime} seconds.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // VERIFICAÇÃO CRÍTICA: Verifica se o plot ainda tem a mesma plantação
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

      // Prevenção de race condition: garante que o profile ainda existe
      const updatedProfile = await tx.profile.update({
        where: { id: profile.id },
        data: {
          coins: {
            increment: plot.crop.sellPrice,
          },
        },
      });

      // Adiciona experiência usando ExperienceService dentro da mesma transação
      const experienceResult = await this.experienceService.addExperience(profile.id, plot.crop.xpReward, tx);

      // Limpa o plot APÓS adicionar XP e moedas
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
      await this.activityService.logHarvesting(userId, plot.crop.name, plotIndex, plot.crop.sellPrice, plot.crop.xpReward, tx);

      // Log de level up se ocorreu
      if (experienceResult.levelUp) {
        await this.activityService.logLevelUp(userId, experienceResult.newLevel, experienceResult.newLevel - experienceResult.levelsGained, tx);
      }

      return {
        harvestedCrop: plot.crop,
        earnedCoins: plot.crop.sellPrice,
        earnedXp: plot.crop.xpReward,
        plot: clearedPlot,
        newExperience: experienceResult.newExperience,
        levelUp: experienceResult.levelUp,
        newLevel: experienceResult.newLevel,
        levelsGained: experienceResult.levelsGained,
      };
    });
  }
}
