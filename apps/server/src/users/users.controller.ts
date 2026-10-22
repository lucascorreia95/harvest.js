import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req) {
    return this.usersService.getUserProfile(req.user.sub);
  }

  @Put('profile')
  async updateProfile(
    @Req() req,
    @Body()
    profileData: {
      displayName?: string;
      avatar?: string;
      bio?: string;
      farmName?: string;
    },
  ) {
    return this.usersService.updateProfile(req.user.sub, profileData);
  }
}
