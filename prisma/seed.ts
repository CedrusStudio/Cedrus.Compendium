import { seedEquipment } from './seeds/equipmentSeed';
import { seedCombat } from './seeds/combatSeed';
import { seedCharacter } from './seeds/characterSeed';

export async function seed() 
{
  console.log(`Start seeding ...`);

  // Seed equipment first (no dependencies)
  await seedEquipment();
  
  // Seed combat data (no dependencies)
  await seedCombat();
  
  // Seed characters last (depends on equipment and combat data)
  await seedCharacter();

  console.log(`Seeding finished.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Seed process completed');
  });