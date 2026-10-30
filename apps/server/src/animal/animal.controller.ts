import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnimalService } from './animal.service';
import {
  AnimalDto,
  AnimalsResponseDto,
  FeedAnimalDto,
  FeedAnimalResponseDto,
  CollectProductDto,
  CollectProductResponseDto,
  SellAnimalDto,
  SellAnimalResponseDto,
} from './dto/animal.dto';

@Controller('animals')
@UseGuards(JwtAuthGuard)
export class AnimalController {
  constructor(private readonly animalService: AnimalService) {}

  @Get()
  async getAnimals(@Req() req): Promise<AnimalsResponseDto> {
    const userId = req.user?.sub || req.user?.userId;
    return this.animalService.getAnimals(userId);
  }

  @Post('buy')
  async buyAnimal(
    @Req() req,
    @Body() body: { animalSlug: string },
  ): Promise<AnimalDto> {
    const userId = req.user?.sub || req.user?.userId;
    return this.animalService.buyAnimal(userId, body.animalSlug);
  }

  @Post('feed')
  async feedAnimal(
    @Req() req,
    @Body() feedAnimalDto: FeedAnimalDto,
  ): Promise<FeedAnimalResponseDto> {
    const userId = req.user?.sub || req.user?.userId;
    return this.animalService.feedAnimal(userId, feedAnimalDto.animalSlug);
  }

  @Post('collect')
  async collectProduct(
    @Req() req,
    @Body() collectProductDto: CollectProductDto,
  ): Promise<CollectProductResponseDto> {
    const userId = req.user?.sub || req.user?.userId;
    return this.animalService.collectProduct(userId, collectProductDto.animalSlug);
  }

  @Post('sell')
  async sellAnimal(
    @Req() req,
    @Body() sellAnimalDto: SellAnimalDto,
  ): Promise<SellAnimalResponseDto> {
    const userId = req.user?.sub || req.user?.userId;
    return this.animalService.sellAnimal(userId, sellAnimalDto.animalSlug);
  }
}
