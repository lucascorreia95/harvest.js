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
    description: 'Regador resistente para manter a plantação hidratada.',
    type: 'TOOL',
    buyPrice: 150,
    sellPrice: 50,
    minLevel: 3,
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
