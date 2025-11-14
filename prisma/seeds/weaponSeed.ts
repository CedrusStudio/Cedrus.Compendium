import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedWeapons() {
  console.log(`Seeding weapons...`);

  const weapons = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'weapons.json'), 'utf-8'));
  console.log(`Loaded ${weapons.length} weapons`);

  await prisma.weapon.deleteMany({});
  console.log(`Deleted existing weapons`);

  let count = 0;
  for (const weapon of weapons) {
    await prisma.weapon.create({ data: weapon });
    count++;
    if (count % 50 === 0) {
      console.log(`  Seeded ${count}/${weapons.length} weapons...`);
    }
  }
  console.log(`✅ Seeded ${count} weapons`);
}

seedWeapons()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Weapon seeding completed');
  });
