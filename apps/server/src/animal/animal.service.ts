import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { InventoryService } from '../inventory/inventory.service';
import { ActivityService } from '../activity/activity.service';
import {
  AnimalDto,
  AnimalsResponseDto,
  FeedAnimalResponseDto,
  CollectProductResponseDto,
  SellAnimalResponseDto,
} from './dto/animal.dto';

@Injectable()
export class AnimalService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private inventoryService: InventoryService,
    private activityService: ActivityService,
  ) {}

  async getAnimals(userId: string): Promise<AnimalsResponseDto> {
    const profile = await this.usersService.getUserProfile(userId);
    const animals = await this.prisma.animal.findMany({
      where: { profileId: profile.id },
      include: { animal: true },
    });

    const enrichedAnimals: AnimalDto[] = animals.map((animal) => {
      const animalDef = animal.animal;
      const now = new Date();
      const fedAt = animal.fedAt ? new Date(animal.fedAt) : null;
      const productionTime = animalDef.productionTime || 0;

      // Calcula se o produto está pronto baseado no tempo
      let productReady = false;
      if (fedAt) {
        const timeSinceFed = Math.floor((now.getTime() - fedAt.getTime()) / 1000);
        productReady = timeSinceFed >= productionTime;
      }

      // Verifica se pode alimentar (não está alimentado ou produto já foi coletado)
      const canFeed = !fedAt || productReady;

      // Verifica se pode coletar (produto está pronto)
      const canCollect = productReady;

      // Verifica se pode vender (apenas porcos que atingiram peso máximo)
      const canSell = animalDef.slug === 'pig' && animal.weight >= (animalDef.maxWeight || 0);

      return {
        id: animal.id,
        animalSlug: animal.animalSlug,
        animalName: animalDef.name,
        animalType: animalDef.type,
        fedAt: animal.fedAt?.toISOString(),
        productReady,
        weight: animal.weight,
        maxWeight: animalDef.maxWeight,
        canFeed,
        canCollect,
        canSell,
        productionTime: animalDef.productionTime,
        foodSlug: animalDef.foodSlug,
        foodQuantity: animalDef.foodQuantity,
        yieldItemSlug: animalDef.yieldItemSlug,
      };
    });

    return {
      serverTime: new Date().toISOString(),
      totalAnimals: enrichedAnimals.length,
      animals: enrichedAnimals,
    };
  }

  async buyAnimal(userId: string, animalSlug: string): Promise<AnimalDto> {
    const item = await this.prisma.item.findUnique({
      where: { slug: animalSlug },
    });

    if (!item) {
      throw new NotFoundException(`Animal não encontrado: ${animalSlug}`);
    }

    if (item.type !== 'ANIMAL') {
      throw new BadRequestException(`O item ${item.name} não é um animal.`);
    }

    // Valida campos obrigatórios para animais
    if (!item.foodSlug) {
      throw new BadRequestException(`${item.name} não tem comida definida.`);
    }

    // Valida campos específicos para porcos
    if (item.slug === 'pig') {
      if (!item.maxWeight || !item.weightGain) {
        throw new BadRequestException(`${item.name} está configurado incorretamente. Faltam campos de peso.`);
      }
    }

    const profile = await this.usersService.getUserProfile(userId);

    if (profile.level < item.minLevel) {
      throw new BadRequestException(
        `Nível insuficiente para comprar ${item.name}. Necessário nível: ${item.minLevel}`,
      );
    }

    if (profile.coins < item.buyPrice) {
      throw new BadRequestException(
        `Moedas insuficientes. Custo: ${item.buyPrice}, saldo: ${profile.coins}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Verifica se já tem um animal desse tipo (dentro da transação)
      const existingAnimal = await tx.animal.findUnique({
        where: {
          profileId_animalSlug: {
            profileId: profile.id,
            animalSlug,
          },
        },
      });

      if (existingAnimal) {
        throw new BadRequestException(`Você já possui um ${item.name}. Apenas 1 animal por tipo é permitido.`);
      }

      // Debita moedas com trava de concorrência
      const updatedProfile = await tx.profile.update({
        where: {
          id: profile.id,
          coins: { gte: item.buyPrice },
        },
        data: { coins: { decrement: item.buyPrice } },
      });

      // Cria o animal
      const animal = await tx.animal.create({
        data: {
          profileId: profile.id,
          animalSlug,
          weight: 0, // Começa com peso 0 (para porcos)
        },
        include: { animal: true },
      });

      // Log da compra
      await this.activityService.logSpendCoins(
        userId,
        item.buyPrice,
        `Compra de ${item.name}`,
        tx,
      );

      // Log específico de animal
      const user = await this.usersService.findById(userId);
      await this.activityService.logActivity(
        userId,
        'buy_animal',
        `${user?.username || 'Unknown'} comprou um ${item.name}`,
        { animalSlug, animalName: item.name },
        tx,
      );

      return {
        id: animal.id,
        animalSlug: animal.animalSlug,
        animalName: animal.animal.name,
        animalType: animal.animal.type,
        fedAt: animal.fedAt?.toISOString(),
        productReady: false,
        weight: animal.weight,
        maxWeight: animal.animal.maxWeight,
        canFeed: true,
        canCollect: false,
        canSell: false,
        productionTime: animal.animal.productionTime,
        foodSlug: animal.animal.foodSlug,
        foodQuantity: animal.animal.foodQuantity,
        yieldItemSlug: animal.animal.yieldItemSlug,
      };
    });
  }

  async feedAnimal(userId: string, animalSlug: string): Promise<FeedAnimalResponseDto> {
    const profile = await this.usersService.getUserProfile(userId);

    const animal = await this.prisma.animal.findUnique({
      where: {
        profileId_animalSlug: {
          profileId: profile.id,
          animalSlug,
        },
      },
      include: { animal: true },
    });

    if (!animal) {
      throw new NotFoundException(`Animal não encontrado: ${animalSlug}`);
    }

    const animalDef = animal.animal;

    const foodSlug = animalDef.foodSlug;
    const foodQuantity = animalDef.foodQuantity || 1;

    // Verifica se o animal já está alimentado e produto não foi coletado
    if (animal.fedAt) {
      const fedAt = new Date(animal.fedAt);
      const now = new Date();
      const timeSinceFed = Math.floor((now.getTime() - fedAt.getTime()) / 1000);
      const productionTime = animalDef.productionTime || 0;

      // Se o tempo de produção ainda não passou, não pode alimentar novamente
      if (timeSinceFed < productionTime) {
        throw new BadRequestException(`${animalDef.name} já está alimentado e aguardando produção.`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Verifica se tem comida no inventário (dentro da transação)
      const hasFood = await this.inventoryService.hasItem(profile.id, foodSlug, foodQuantity, tx);

      if (!hasFood) {
        throw new BadRequestException(
          `Comida insuficiente. Você precisa de ${foodQuantity}x ${foodSlug}.`,
        );
      }

      // Consome a comida
      await this.inventoryService.removeItem(profile.id, foodSlug, foodQuantity, tx);

      // Atualiza o animal
      const now = new Date();
      await tx.animal.update({
        where: { id: animal.id },
        data: {
          fedAt: now,
          // Se for porco, aumenta o peso
          weight: animalDef.slug === 'pig'
            ? (animal.weight || 0) + (animalDef.weightGain || 0)
            : animal.weight,
        },
      });

      // Calcula quando o produto estará pronto
      const productionTime = animalDef.productionTime || 0;
      const productReadyAt = new Date(now.getTime() + productionTime * 1000);

      // Log da alimentação
      await this.activityService.logActivity(
        userId,
        'feed_animal',
        `${profile.userId} alimentou ${animalDef.name}`,
        { animalSlug, animalName: animalDef.name, foodSlug, foodQuantity },
        tx,
      );

      // Busca comida restante no inventário
      const remainingFoodItem = await tx.inventoryItem.findUnique({
        where: {
          profileId_itemSlug: {
            profileId: profile.id,
            itemSlug: foodSlug,
          },
        },
      });

      return {
        animalSlug,
        animalName: animalDef.name,
        fedAt: now.toISOString(),
        productReadyAt: productReadyAt.toISOString(),
        remainingFood: remainingFoodItem?.quantity || 0,
      };
    });
  }

  async collectProduct(userId: string, animalSlug: string): Promise<CollectProductResponseDto> {
    const profile = await this.usersService.getUserProfile(userId);

    const animal = await this.prisma.animal.findUnique({
      where: {
        profileId_animalSlug: {
          profileId: profile.id,
          animalSlug,
        },
      },
      include: { animal: true },
    });

    if (!animal) {
      throw new NotFoundException(`Animal não encontrado: ${animalSlug}`);
    }

    const animalDef = animal.animal;

    // Porcos não podem coletar produto (são vendidos)
    if (animalDef.slug === 'pig') {
      throw new BadRequestException(`Porcos não produzem itens. Venda o porco quando atingir o peso máximo.`);
    }

    // Verifica se o produto está pronto baseado no tempo
    if (!animal.fedAt) {
      throw new BadRequestException(`${animalDef.name} ainda não foi alimentado.`);
    }

    const fedAt = new Date(animal.fedAt);
    const now = new Date();
    const timeSinceFed = Math.floor((now.getTime() - fedAt.getTime()) / 1000);
    const productionTime = animalDef.productionTime || 0;

    if (timeSinceFed < productionTime) {
      const remainingTime = productionTime - timeSinceFed;
      throw new BadRequestException(
        `${animalDef.name} ainda não tem produto pronto. Tempo restante: ${remainingTime} segundos.`,
      );
    }

    const yieldItemSlug = animalDef.yieldItemSlug;
    if (!yieldItemSlug) {
      throw new BadRequestException(`${animalDef.name} não produz itens.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Busca o produto para pegar o nome antes de adicionar
      const product = await tx.item.findUnique({
        where: { slug: yieldItemSlug },
      });

      if (!product) {
        throw new NotFoundException(`Produto não encontrado: ${yieldItemSlug}`);
      }

      // Adiciona o produto ao inventário
      await this.inventoryService.addItem(profile.id, yieldItemSlug, 1, tx);

      // Reseta o estado do animal (apenas fedAt)
      await tx.animal.update({
        where: { id: animal.id },
        data: {
          fedAt: null,
        },
      });

      // Log da coleta
      await this.activityService.logActivity(
        userId,
        'collect_product',
        `${profile.userId} coletou ${product.name} de ${animalDef.name}`,
        { animalSlug, animalName: animalDef.name, productSlug: yieldItemSlug, productName: product.name },
        tx,
      );

      return {
        animalSlug,
        animalName: animalDef.name,
        productSlug: yieldItemSlug,
        productName: product.name,
        quantity: 1,
      };
    });
  }

  async sellAnimal(userId: string, animalSlug: string): Promise<SellAnimalResponseDto> {
    const profile = await this.usersService.getUserProfile(userId);

    const animal = await this.prisma.animal.findUnique({
      where: {
        profileId_animalSlug: {
          profileId: profile.id,
          animalSlug,
        },
      },
      include: { animal: true },
    });

    if (!animal) {
      throw new NotFoundException(`Animal não encontrado: ${animalSlug}`);
    }

    const animalDef = animal.animal;

    // Apenas porcos podem ser vendidos
    if (animalDef.slug !== 'pig') {
      throw new BadRequestException(`Apenas porcos podem ser vendidos.`);
    }

    const maxWeight = animalDef.maxWeight || 0;
    const currentWeight = animal.weight || 0;

    if (currentWeight < maxWeight) {
      throw new BadRequestException(
        `Porco ainda não atingiu o peso máximo. Peso atual: ${currentWeight}kg, máximo: ${maxWeight}kg`,
      );
    }

    // Calcula preço de venda baseado no peso
    const basePrice = animalDef.sellPrice || 0;
    const weightBonus = Math.floor((currentWeight / maxWeight) * basePrice * 0.5); // Bônus de até 50%
    const sellPrice = basePrice + weightBonus;

    return this.prisma.$transaction(async (tx) => {
      // Verifica se o animal ainda existe e não foi vendido (race condition)
      const currentAnimal = await tx.animal.findUnique({
        where: { id: animal.id },
        include: { animal: true },
      });

      if (!currentAnimal) {
        throw new BadRequestException('Animal não encontrado. Já pode ter sido vendido.');
      }

      // Credita moedas (incremento não precisa de trava como decremento)
      // Ganhar moedas extras não é crítico como gastar moedas inexistentes
      await tx.profile.update({
        where: { id: profile.id },
        data: { coins: { increment: sellPrice } },
      });

      // Remove o animal
      await tx.animal.delete({
        where: { id: animal.id },
      });

      // Log da venda
      await this.activityService.logEarnCoins(
        userId,
        sellPrice,
        `Venda de ${animalDef.name} (${currentWeight}kg)`,
        tx,
      );

      await this.activityService.logActivity(
        userId,
        'sell_animal',
        `${profile.userId} vendeu ${animalDef.name} por ${sellPrice} moedas`,
        { animalSlug, animalName: animalDef.name, weight: currentWeight, sellPrice },
        tx,
      );

      return {
        animalSlug,
        animalName: animalDef.name,
        weight: currentWeight,
        sellPrice,
        earnedCoins: sellPrice,
      };
    });
  }
}
