import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivityService } from './activity.service';
import { ActivityQueryDto, ActivityResponseDto, ActivityStatsDto } from './dto/activity.dto';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  async getUserActivities(@Request() req, @Query() query: ActivityQueryDto): Promise<ActivityResponseDto[]> {
    const userId = req.user.sub || req.user.userId;
    const { limit = 20, offset = 0, action } = query;

    let activities;
    if (action) {
      activities = await this.activityService.getActivitiesByAction(userId, action as any, limit);
    } else {
      activities = await this.activityService.getUserActivities(userId, limit, offset);
    }

    return activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      action: activity.action,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt.toISOString(),
    }));
  }

  @Get('stats')
  async getActivityStats(@Request() req): Promise<ActivityStatsDto[]> {
    const userId = req.user.sub || req.user.userId;
    const stats = await this.activityService.getActivityStats(userId);
    
    return stats.map(stat => ({
      action: stat.action,
      count: stat.count,
    }));
  }

  @Get('recent')
  async getRecentActivities(@Query('limit') limit?: number): Promise<ActivityResponseDto[]> {
    const activities = await this.activityService.getRecentActivities(limit || 20);
    
    return activities.map(activity => ({
      id: activity.id,
      userId: activity.userId,
      action: activity.action,
      description: activity.description,
      metadata: activity.metadata,
      createdAt: activity.createdAt.toISOString(),
    }));
  }
}
