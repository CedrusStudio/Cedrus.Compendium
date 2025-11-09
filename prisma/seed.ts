import { seedEquipment } from './seeds/equipmentSeed';
import { seedCombat } from './seeds/combatSeed';
import { seedCharacter } from './seeds/characterSeed';

export async function seed() 
{
  console.log(`Start seeding ...`);

  await seedCombat();
  await seedEquipment();
  await seedCharacter();

  console.log(`Seeding finished.`);
}