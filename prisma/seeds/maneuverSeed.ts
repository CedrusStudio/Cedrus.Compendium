import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedManeuvers() {
  console.log(`Seeding maneuvers...`);

  const maneuvers = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'maneuvers.json'), 'utf-8'));
  console.log(`Loaded ${maneuvers.length} maneuvers`);

  await prisma.maneuver.deleteMany({});
  console.log(`Deleted existing maneuvers`);

  let count = 0;
  for (const maneuver of maneuvers) {
    await prisma.maneuver.create({ data: maneuver });
    count++;
    if (count % 50 === 0) {
      console.log(`  Seeded ${count}/${maneuvers.length} maneuvers...`);
    }
  }
  console.log(`✅ Seeded ${count} maneuvers`);
}

seedManeuvers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Maneuver seeding completed');
  });
