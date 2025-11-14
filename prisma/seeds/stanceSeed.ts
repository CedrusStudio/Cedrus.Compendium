import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedStances() {
  console.log(`Seeding stances...`);

  const stances = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'stances.json'), 'utf-8'));
  console.log(`Loaded ${stances.length} stances`);

  await prisma.stance.deleteMany({});
  console.log(`Deleted existing stances`);

  let count = 0;
  for (const stance of stances) {
    await prisma.stance.create({ data: stance });
    count++;
    if (count % 10 === 0) {
      console.log(`  Seeded ${count}/${stances.length} stances...`);
    }
  }
  console.log(`✅ Seeded ${count} stances`);
}

seedStances()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Stance seeding completed');
  });
