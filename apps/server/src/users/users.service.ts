import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(
    userId: string,
    profileData: {
      displayName?: string;
      avatar?: string;
      bio?: string;
      farmName?: string;
    },
  ) {
    return this.prisma.profile.update({
      where: { userId },
      data: profileData,
    });
  }
}
