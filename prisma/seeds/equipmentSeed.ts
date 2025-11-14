import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedEquipment() {
  console.log(`Seeding equipment data...`);

  // Load data from JSON files
  console.log(`Loading equipment data from JSON files...`);
  const weapons = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'weapons.json'), 'utf-8'));
  const armors = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'armors.json'), 'utf-8'));
  const shields = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'shields.json'), 'utf-8'));

  console.log(`Loaded ${weapons.length} weapons, ${armors.length} armors, ${shields.length} shields`);

  // Delete all existing equipment data
  console.log(`Deleting existing equipment data...`);
  await prisma.weapon.deleteMany({});
  await prisma.armor.deleteMany({});
  await prisma.shield.deleteMany({});
  console.log(`Deleted all existing equipment data`);

  // Seed weapons
  console.log(`Seeding ${weapons.length} weapons...`);
  let weaponCount = 0;
  for (const weapon of weapons) {
    await prisma.weapon.create({ data: weapon });
    weaponCount++;
    if (weaponCount % 50 === 0) {
      console.log(`  Seeded ${weaponCount}/${weapons.length} weapons...`);
    }
  }
  console.log(`✅ Seeded ${weaponCount} weapons`);

  // Seed armors
  console.log(`Seeding ${armors.length} armors...`);
  let armorCount = 0;
  for (const armor of armors) {
    await prisma.armor.create({ data: armor });
    armorCount++;
    if (armorCount % 20 === 0) {
      console.log(`  Seeded ${armorCount}/${armors.length} armors...`);
    }
  }
  console.log(`✅ Seeded ${armorCount} armors`);

  // Seed shields
  console.log(`Seeding ${shields.length} shields...`);
  let shieldCount = 0;
  for (const shield of shields) {
    await prisma.shield.create({ data: shield });
    shieldCount++;
  }
  console.log(`✅ Seeded ${shieldCount} shields`);

  console.log(`✅ Equipment seeding finished.`);
}
