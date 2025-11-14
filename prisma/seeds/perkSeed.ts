import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedPerks() {
  console.log(`Seeding perks...`);

  const perks = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'perks.json'), 'utf-8'));
  console.log(`Loaded ${perks.length} perks`);

  await prisma.perk.deleteMany({});
  console.log(`Deleted existing perks`);

  let count = 0;
  for (const perk of perks) {
    await prisma.perk.create({ data: perk });
    count++;
    if (count % 50 === 0) {
      console.log(`  Seeded ${count}/${perks.length} perks...`);
    }
  }
  console.log(`✅ Seeded ${count} perks`);
}

seedPerks()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Perk seeding completed');
  });
