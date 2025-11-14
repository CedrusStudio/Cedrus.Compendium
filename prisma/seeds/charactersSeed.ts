import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedCharacters() {
  console.log(`Seeding characters...`);

  const characters = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'characters.json'), 'utf-8'));
  console.log(`Loaded ${characters.length} characters`);

  await prisma.character.deleteMany({});
  console.log(`Deleted existing characters`);

  let count = 0;
  for (const character of characters) {
    await prisma.character.create({ data: character });
    count++;
    if (count % 25 === 0) {
      console.log(`  Seeded ${count}/${characters.length} characters...`);
    }
  }
  console.log(`✅ Seeded ${count} characters`);
}

seedCharacters()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('Character seeding completed');
  });
