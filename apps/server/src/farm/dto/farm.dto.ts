import { IsNumber, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class UnlockPlotDto {
  @IsNumber()
  @Min(0)
  @Max(27)
  plotIndex: number;
}

export class PlantCropDto {
  @IsNumber()
  @Min(0)
  @Max(27)
  plotIndex: number;

  @IsString()
  @IsNotEmpty()
  cropSlug: string;
}

export class HarvestCropDto {
  @IsNumber()
  @Min(0)
  @Max(27)
  plotIndex: number;
}
