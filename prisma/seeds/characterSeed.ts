import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedCharacter() {
  console.log(`Seeding character data...`);

  // Load data from JSON file
  console.log(`Loading characters from JSON file...`);
  const characters = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'characters.json'), 'utf-8'));

  console.log(`Loaded ${characters.length} characters`);

  // Delete all existing character data
  console.log(`Deleting existing character data...`);
  await prisma.character.deleteMany({});
  console.log(`Deleted all existing character data`);

  // Seed characters
  console.log(`Seeding ${characters.length} characters...`);
  let characterCount = 0;
  for (const character of characters) {
    await prisma.character.create({ data: character });
    characterCount++;
    if (characterCount % 25 === 0) {
      console.log(`  Seeded ${characterCount}/${characters.length} characters...`);
    }
  }
  console.log(`✅ Seeded ${characterCount} characters`);

  console.log(`✅ Character seeding finished.`);
}
