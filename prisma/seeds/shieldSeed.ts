import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedShields() {
  console.log(`Seeding shields...`);

  const shields = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'shields.json'), 'utf-8'));
  console.log(`Loaded ${shields.length} shields`);

  await prisma.shield.deleteMany({});
  console.log(`Deleted existing shields`);

  let count = 0;
  for (const shield of shields) {
    await prisma.shield.create({ data: shield });
    count++;
  }
  console.log(`✅ Seeded ${count} shields`);
}

seedShields()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Shield seeding completed');
  });
