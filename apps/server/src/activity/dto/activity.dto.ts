import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ActivityQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  offset?: number = 0;

  @IsOptional()
  @IsEnum(['plant', 'harvest', 'unlock_plot', 'level_up', 'earn_coins', 'spend_coins'])
  action?: string;
}

export class ActivityResponseDto {
  id: string;
  userId: string;
  action: string;
  description: string;
  metadata?: any;
  createdAt: string;
}

export class ActivityStatsDto {
  action: string;
  count: number;
}
