import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedArmors() {
  console.log(`Seeding armors...`);

  const armors = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'armors.json'), 'utf-8'));
  console.log(`Loaded ${armors.length} armors`);

  await prisma.armor.deleteMany({});
  console.log(`Deleted existing armors`);

  let count = 0;
  for (const armor of armors) {
    await prisma.armor.create({ data: armor });
    count++;
    if (count % 20 === 0) {
      console.log(`  Seeded ${count}/${armors.length} armors...`);
    }
  }
  console.log(`✅ Seeded ${count} armors`);
}

seedArmors()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Armor seeding completed');
  });
