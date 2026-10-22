import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

export type ActivityAction = 'plant' | 'harvest' | 'unlock_plot' | 'level_up' | 'earn_coins' | 'spend_coins';

export interface ActivityMetadata {
  cropSlug?: string;
  cropName?: string;
  plotIndex?: number;
  coins?: number;
  xpGained?: number;
  newLevel?: number;
  oldLevel?: number;
  sellPrice?: number;
  unlockCost?: number;
  [key: string]: any;
}

@Injectable()
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService
  ) {}

  async logActivity(
    userId: string,
    action: ActivityAction,
    description: string,
    metadata?: ActivityMetadata,
    tx?: any
  ) {
    const db = tx || this.prisma;
    
    return db.activityLog.create({
      data: {
        userId,
        action,
        description,
        metadata: metadata || null,
      },
    });
  }

  async logPlanting(userId: string, cropName: string, plotIndex: number, cropSlug: string, coins: number, tx?: any) {
    const username = await this.getUsername(userId);
    const description = `${username} plantou ${cropName} no Plot ${plotIndex}`;
    
    return this.logActivity(userId, 'plant', description, {
      cropSlug,
      cropName,
      plotIndex,
      coins,
    }, tx);
  }

  async logHarvesting(userId: string, cropName: string, plotIndex: number, sellPrice: number, xpGained: number, tx?: any) {
    const username = await this.getUsername(userId);
    const description = `${username} colheu ${cropName} no Plot ${plotIndex}`;
    
    return this.logActivity(userId, 'harvest', description, {
      cropName,
      plotIndex,
      sellPrice,
      xpGained,
    }, tx);
  }

  async logUnlockPlot(userId: string, plotIndex: number, cost: number, tx?: any) {
    const username = await this.getUsername(userId);
    const description = `${username} desbloqueou o Plot ${plotIndex}`;
    
    return this.logActivity(userId, 'unlock_plot', description, {
      plotIndex,
      unlockCost: cost,
    }, tx);
  }

  async logLevelUp(userId: string, newLevel: number, oldLevel: number, tx?: any) {
    const username = await this.getUsername(userId);
    const description = `${username} subiu para o Nível ${newLevel}`;
    
    return this.logActivity(userId, 'level_up', description, {
      newLevel,
      oldLevel,
    }, tx);
  }

  async logEarnCoins(userId: string, amount: number, source: string, tx?: any) {
    const username = await this.getUsername(userId);
    const description = `${username} ganhou ${amount} moedas (${source})`;
    
    return this.logActivity(userId, 'earn_coins', description, {
      coins: amount,
      source,
    }, tx);
  }

  async logSpendCoins(userId: string, amount: number, purpose: string, tx?: any) {
    const username = await this.getUsername(userId);
    const description = `${username} gastou ${amount} moedas (${purpose})`;
    
    return this.logActivity(userId, 'spend_coins', description, {
      coins: amount,
      purpose,
    }, tx);
  }

  async getUserActivities(userId: string, limit: number = 50, offset: number = 0) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async getRecentActivities(limit: number = 20) {
    return this.prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getActivitiesByAction(userId: string, action: ActivityAction, limit: number = 20) {
    return this.prisma.activityLog.findMany({
      where: { 
        userId,
        action 
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getActivityStats(userId: string) {
    const stats = await this.prisma.activityLog.groupBy({
      by: ['action'],
      where: { userId },
      _count: {
        action: true,
      },
    });

    return stats.map(stat => ({
      action: stat.action,
      count: stat._count.action,
    }));
  }

  private async getUsername(userId: string): Promise<string> {
    try {
      const user = await this.usersService.findById(userId);
      return user?.username || 'Unknown';
    } catch {
      return 'Unknown';
    }
  }
}
