import { PrismaClient } from '../generated/index.js';

const prisma = new PrismaClient();

const items = [
  // Sementes (compráveis na loja)
  {
    name: 'Semente de Trigo',
    slug: 'wheat_seed',
    description: 'Semente de trigo de crescimento rápido (30s).',
    type: 'SEED',
    buyPrice: 10,
    sellPrice: 5,
    minLevel: 1,
    growthTime: 30,
    xpReward: 5,
    yieldItemSlug: 'wheat',
    waterDuration: 10, // 10s úmido após regar (permite regar ~3x durante 30s)
    waterTimeBonus: 5, // Reduz 5s por regada
    waterXpBonus: 2, // +2 XP por regada na colheita
  },
  {
    name: 'Semente de Cenoura',
    slug: 'carrot_seed',
    description: 'Semente de cenoura comum (2min).',
    type: 'SEED',
    buyPrice: 30,
    sellPrice: 15,
    minLevel: 2,
    growthTime: 120,
    xpReward: 15,
    yieldItemSlug: 'carrot',
    waterDuration: 30, // 30s úmido após regar (permite regar ~4x durante 2min)
    waterTimeBonus: 10, // Reduz 10s por regada
    waterXpBonus: 3, // +3 XP por regada na colheita
  },
  {
    name: 'Semente de Milho',
    slug: 'corn_seed',
    description: 'Semente de milho dourado (5min).',
    type: 'SEED',
    buyPrice: 80,
    sellPrice: 40,
    minLevel: 5,
    growthTime: 300,
    xpReward: 40,
    yieldItemSlug: 'corn',
    waterDuration: 60, // 60s úmido após regar (permite regar ~5x durante 5min)
    waterTimeBonus: 15, // Reduz 15s por regada
    waterXpBonus: 5, // +5 XP por regada na colheita
  },

  // Fertilizantes (compráveis na loja)
  {
    name: 'Fertilizante Rápido',
    slug: 'speed_fertilizer',
    description: 'Adubo especial que acelera o crescimento da planta.',
    type: 'FERTILIZER',
    buyPrice: 25,
    sellPrice: 10,
    minLevel: 2,
  },

  // Ferramentas (compráveis na loja)
  {
    name: 'Regador de Cobre',
    slug: 'copper_watering_can',
    description: 'Regador resistente para manter a plantação hidratada. Presente inicial.',
    type: 'TOOL',
    buyPrice: 0, // Não é comprável (presente inicial)
    sellPrice: 0, // Não pode ser vendido
    minLevel: 1,
  },
  {
    name: 'Pesticida Natural',
    slug: 'natural_pesticide',
    description: 'Pesticida natural para remover pragas das plantas. Presente inicial.',
    type: 'TOOL',
    buyPrice: 0, // Não é comprável (presente inicial)
    sellPrice: 0, // Não pode ser vendido
    minLevel: 1,
  },

  // Animais (compráveis na loja)
  {
    name: 'Galinha',
    slug: 'chicken',
    description: 'Galinha que bota ovos quando alimentada.',
    type: 'ANIMAL',
    buyPrice: 200,
    sellPrice: 50,
    minLevel: 3,
    productionTime: 60, // 1 minuto para botar ovo após alimentar
    foodSlug: 'chicken_feed',
    foodQuantity: 1,
    yieldItemSlug: 'egg',
  },
  {
    name: 'Porco',
    slug: 'pig',
    description: 'Porco que engorda quando alimentado e pode ser vendido.',
    type: 'ANIMAL',
    buyPrice: 300,
    sellPrice: 100,
    minLevel: 5,
    productionTime: 120, // 2 minutos para engordar após alimentar
    foodSlug: 'pig_feed',
    foodQuantity: 2,
    maxWeight: 100, // Peso máximo em kg
    weightGain: 10, // Ganha 10kg por alimentação
  },
  {
    name: 'Vaca',
    slug: 'cow',
    description: 'Vaca que produz leite quando alimentada.',
    type: 'ANIMAL',
    buyPrice: 500,
    sellPrice: 150,
    minLevel: 7,
    productionTime: 180, // 3 minutos para produzir leite após alimentar
    foodSlug: 'cow_feed',
    foodQuantity: 3,
    yieldItemSlug: 'milk',
  },

  // Comidas para animais (compráveis na loja)
  {
    name: 'Ração de Galinha',
    slug: 'chicken_feed',
    description: 'Ração nutritiva para galinhas.',
    type: 'FOOD',
    buyPrice: 5,
    sellPrice: 2,
    minLevel: 3,
  },
  {
    name: 'Ração de Porco',
    slug: 'pig_feed',
    description: 'Ração especial para porcos engordarem.',
    type: 'FOOD',
    buyPrice: 10,
    sellPrice: 4,
    minLevel: 5,
  },
  {
    name: 'Ração de Vaca',
    slug: 'cow_feed',
    description: 'Ração rica para vacas produzirem leite.',
    type: 'FOOD',
    buyPrice: 15,
    sellPrice: 6,
    minLevel: 7,
  },

  // Produtos de animais (NÃO compráveis na loja: buyPrice = 0, apenas vendíveis)
  {
    name: 'Ovo',
    slug: 'egg',
    description: 'Ovo fresco de galinha.',
    type: 'ANIMAL_PRODUCT',
    buyPrice: 0,
    sellPrice: 15,
    minLevel: 3,
  },
  {
    name: 'Leite',
    slug: 'milk',
    description: 'Leite fresco de vaca.',
    type: 'ANIMAL_PRODUCT',
    buyPrice: 0,
    sellPrice: 25,
    minLevel: 7,
  },

  // Colheitas (NÃO compráveis na loja: buyPrice = 0, apenas vendíveis)
  {
    name: 'Trigo',
    slug: 'wheat',
    description: 'Trigo colhido fresco, pronto para venda.',
    type: 'CROP',
    buyPrice: 0,
    sellPrice: 25,
    minLevel: 1,
  },
  {
    name: 'Cenoura',
    slug: 'carrot',
    description: 'Cenoura colhida e crocante.',
    type: 'CROP',
    buyPrice: 0,
    sellPrice: 80,
    minLevel: 2,
  },
  {
    name: 'Milho',
    slug: 'corn',
    description: 'Espiga de milho colhida.',
    type: 'CROP',
    buyPrice: 0,
    sellPrice: 220,
    minLevel: 5,
  },
];

async function main() {
  console.log('🌱 Começando o seeding dos itens do jogo...');

  for (const item of items) {
    await prisma.item.upsert({
      where: { slug: item.slug },
      update: item,
      create: item,
    });
  }

  console.log('✅ Catálogo de itens populado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
