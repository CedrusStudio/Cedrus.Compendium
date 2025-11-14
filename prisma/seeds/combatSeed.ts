import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const FORMATTED_DATA_DIR = path.join(__dirname, '..', '..', 'formatted-data');

export async function seedCombat() {
  console.log(`Seeding combat data...`);

  // Load data from JSON files
  console.log(`Loading combat data from JSON files...`);
  const stances = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'stances.json'), 'utf-8'));
  const states = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'states.json'), 'utf-8'));
  const maneuvers = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'maneuvers.json'), 'utf-8'));
  const perks = JSON.parse(fs.readFileSync(path.join(FORMATTED_DATA_DIR, 'perks.json'), 'utf-8'));

  console.log(`Loaded ${stances.length} stances, ${states.length} states, ${maneuvers.length} maneuvers, ${perks.length} perks`);

  // Delete all existing combat data
  console.log(`Deleting existing combat data...`);
  await prisma.stance.deleteMany({});
  await prisma.state.deleteMany({});
  await prisma.maneuver.deleteMany({});
  await prisma.perk.deleteMany({});
  console.log(`Deleted all existing combat data`);

  // Seed stances
  console.log(`Seeding ${stances.length} stances...`);
  let stanceCount = 0;
  for (const stance of stances) {
    await prisma.stance.create({ data: stance });
    stanceCount++;
    if (stanceCount % 10 === 0) {
      console.log(`  Seeded ${stanceCount}/${stances.length} stances...`);
    }
  }
  console.log(`✅ Seeded ${stanceCount} stances`);

  // Seed states
  console.log(`Seeding ${states.length} states...`);
  let stateCount = 0;
  for (const state of states) {
    await prisma.state.create({ data: state });
    stateCount++;
    if (stateCount % 10 === 0) {
      console.log(`  Seeded ${stateCount}/${states.length} states...`);
    }
  }
  console.log(`✅ Seeded ${stateCount} states`);

  // Seed maneuvers
  console.log(`Seeding ${maneuvers.length} maneuvers...`);
  let maneuverCount = 0;
  for (const maneuver of maneuvers) {
    await prisma.maneuver.create({ data: maneuver });
    maneuverCount++;
    if (maneuverCount % 50 === 0) {
      console.log(`  Seeded ${maneuverCount}/${maneuvers.length} maneuvers...`);
    }
  }
  console.log(`✅ Seeded ${maneuverCount} maneuvers`);

  // Seed perks
  console.log(`Seeding ${perks.length} perks...`);
  let perkCount = 0;
  for (const perk of perks) {
    await prisma.perk.create({ data: perk });
    perkCount++;
    if (perkCount % 50 === 0) {
      console.log(`  Seeded ${perkCount}/${perks.length} perks...`);
    }
  }
  console.log(`✅ Seeded ${perkCount} perks`);

  console.log(`✅ Combat seeding finished.`);
}
