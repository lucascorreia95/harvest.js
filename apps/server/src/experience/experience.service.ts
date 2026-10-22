import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExperienceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calcula o nível com base na experiência total
   * Fórmula: 100 XP por nível (linear)
   */
  calculateLevel(experience: number): number {
    return Math.floor(experience / 100) + 1;
  }

  /**
   * Retorna o XP necessário para atingir um nível específico
   */
  getRequiredXpForLevel(level: number): number {
    return (level - 1) * 100;
  }

  /**
   * Retorna o progresso atual de XP para o próximo nível
   */
  getExperienceProgress(currentXp: number): {
    current: number;
    required: number;
    percentage: number;
    currentLevel: number;
    nextLevel: number;
  } {
    const currentLevel = this.calculateLevel(currentXp);
    const requiredForNext = this.getRequiredXpForLevel(currentLevel + 1);
    const requiredForCurrent = this.getRequiredXpForLevel(currentLevel);
    const current = currentXp - requiredForCurrent;
    const required = requiredForNext - requiredForCurrent;
    const percentage = (current / required) * 100;

    return {
      current,
      required,
      percentage,
      currentLevel,
      nextLevel: currentLevel + 1,
    };
  }

  /**
   * Adiciona experiência a um perfil e verifica se subiu de nível
   * NOTA: Este método deve ser chamado dentro de uma transação existente
   */
  async addExperience(profileId: string, xpAmount: number, prismaTransaction?: any): Promise<{
    newExperience: number;
    newLevel: number;
    levelUp: boolean;
    levelsGained: number;
  }> {
    const tx = prismaTransaction || this.prisma;
    
    // Busca o perfil atual
    const profile = await tx.profile.findUnique({
      where: { id: profileId },
      select: { experience: true, level: true },
    });

    if (!profile) {
      throw new Error('Perfil não encontrado');
    }

    // Calcula nova experiência
    const newExperience = profile.experience + xpAmount;
    const newLevel = this.calculateLevel(newExperience);
    const levelUp = newLevel > profile.level;
    const levelsGained = levelUp ? newLevel - profile.level : 0;

    // Atualiza o perfil
    await tx.profile.update({
      where: { id: profileId },
      data: {
        experience: newExperience,
        level: newLevel,
      },
    });

    return {
      newExperience,
      newLevel,
      levelUp,
      levelsGained,
    };
  }

  /**
   * Verifica se um perfil pode subir de nível com base na experiência atual
   */
  async checkLevelUp(profileId: string): Promise<{
    canLevelUp: boolean;
    currentLevel: number;
    requiredXp: number;
    currentXp: number;
  }> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: profileId },
      select: { experience: true, level: true },
    });

    if (!profile) {
      throw new Error('Perfil não encontrado');
    }

    const currentLevel = this.calculateLevel(profile.experience);
    const canLevelUp = currentLevel > profile.level;
    const requiredXp = this.getRequiredXpForLevel(profile.level + 1);

    return {
      canLevelUp,
      currentLevel: profile.level,
      requiredXp,
      currentXp: profile.experience,
    };
  }
}
