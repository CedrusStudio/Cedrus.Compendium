import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedStates() {
  console.log(`Seeding states...`);

  const states = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'states.json'), 'utf-8'));
  console.log(`Loaded ${states.length} states`);

  await prisma.state.deleteMany({});
  console.log(`Deleted existing states`);

  let count = 0;
  for (const state of states) {
    await prisma.state.create({ data: state });
    count++;
    if (count % 10 === 0) {
      console.log(`  Seeded ${count}/${states.length} states...`);
    }
  }
  console.log(`✅ Seeded ${count} states`);
}

seedStates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('State seeding completed');
  });
