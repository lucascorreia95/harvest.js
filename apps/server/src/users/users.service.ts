import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      throw new NotFoundException('Perfil do usuário não encontrado.');
    }

    return user.profile;
  }

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

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
  }
}
