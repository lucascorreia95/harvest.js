import { PrismaClient } from '../generated/index.js';

const prisma = new PrismaClient();

const crops = [
  {
    name: 'Trigo',
    slug: 'wheat',
    price: 10,
    sellPrice: 25,
    xpReward: 5,
    growthTime: 30, // 30 segundos para teste rápido
    minLevel: 1,
  },
  {
    name: 'Cenoura',
    slug: 'carrot',
    price: 30,
    sellPrice: 80,
    xpReward: 15,
    growthTime: 120, // 2 minutos
    minLevel: 2,
  },
  {
    name: 'Milho',
    slug: 'corn',
    price: 80,
    sellPrice: 220,
    xpReward: 40,
    growthTime: 300, // 5 minutos
    minLevel: 5,
  }
];

async function main() {
  console.log('🌱 Começando o seeding das sementes...');

  for (const crop of crops) {
    await prisma.crop.upsert({
      where: { slug: crop.slug },
      update: {}, // Se já existir, não faz nada
      create: crop, // Se não existir, cria
    });
  }

  console.log('✅ Catálogo de sementes populado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
