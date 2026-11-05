import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Req
} from '@nestjs/common';
import { FarmService } from './farm.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UnlockPlotDto, PlantCropDto, HarvestCropDto, WaterPlotDto, SprayPlotDto } from './dto/farm.dto';

@Controller('farm')
@UseGuards(JwtAuthGuard)
export class FarmController {
  constructor(private farmService: FarmService) {}

  @Get()
  async getFarmState(@Req() req) {
    return this.farmService.getFarmState(req.user.sub);
  }

  @Post('unlock')
  async unlockPlot(@Req() req, @Body() unlockPlotDto: UnlockPlotDto) {
    return this.farmService.unlockPlot(req.user.sub, unlockPlotDto.plotIndex);
  }

  @Post('plant')
  async plantCrop(
    @Req() req, 
    @Body() plantCropDto: PlantCropDto
  ) {
    return this.farmService.plantCrop(
      req.user.sub, 
      plantCropDto.plotIndex, 
      plantCropDto.cropSlug
    );
  }

  @Post('harvest')
  async harvestCrop(@Req() req, @Body() harvestCropDto: HarvestCropDto) {
    return this.farmService.harvestCrop(req.user.sub, harvestCropDto.plotIndex);
  }

  @Post('water')
  async waterPlot(@Req() req, @Body() waterPlotDto: WaterPlotDto) {
    return this.farmService.waterPlot(req.user.sub, waterPlotDto.plotIndex);
  }

  @Post('spray')
  async sprayPlot(@Req() req, @Body() sprayPlotDto: SprayPlotDto) {
    return this.farmService.sprayPlot(req.user.sub, sprayPlotDto.plotIndex);
  }
}
