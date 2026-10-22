import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { InvalidCredentialsException, UserNotFoundException, UserAlreadyExistsException } from './exceptions/auth.exceptions';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { profile: true },
    });

    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        profile: user.profile,
      },
    };
  }

  async createInitialFarm(profileId: string) {
    const initialUnlocked = 6;

    const plots = Array.from({ length: initialUnlocked }).map((_, index) => ({
      profileId,
      index,
      isUnlocked: true, // Todos os plots criados inicialmente estão desbloqueados
    }));

    // Cria apenas os plots iniciais para alta performance e economia de espaço
    await this.prisma.plot.createMany({
      data: plots,
    });
  }

  async signup(signupData: {
    username: string;
    password: string;
    farmName?: string;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: signupData.username }],
      },
    });

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    const hashedPassword = await bcrypt.hash(signupData.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          username: signupData.username,
          password: hashedPassword,
        },
      });

      const profile = await tx.profile.create({
        data: {
          userId: newUser.id,
          farmName: signupData.farmName || `${signupData.username}'s Farm`,
        },
      });

      // Criar apenas os plots iniciais (6 desbloqueados)
      const initialUnlocked = 6;

      const plots = Array.from({ length: initialUnlocked }).map((_, index) => ({
        profileId: profile.id,
        index,
        isUnlocked: true, // Todos os plots criados inicialmente estão desbloqueados
      }));

      await tx.plot.createMany({
        data: plots,
      });

      return newUser;
    });

    const createdUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    const payload = {
      sub: createdUser!.id,
      username: createdUser!.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: createdUser,
    };
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  }
}
