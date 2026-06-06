/**
 * Backfill legacy character power types to the new canonical values.
 *
 * Dry run:
 *   npx tsx scripts/backfill-power-types.ts
 *
 * Apply changes:
 *   npx tsx scripts/backfill-power-types.ts --apply
 */

import prisma from '../src/lib/prisma';
import { normalizePowerType } from '../src/domain/characters/combat/Power';

async function fetchCharacters()
{
  return prisma.character.findMany({
    select: {
      id: true,
      name: true,
      powers: true,
    },
    orderBy: {
      name: 'asc',
    },
  });
}

type CharacterRecord = Awaited<ReturnType<typeof fetchCharacters>>[number];
type CharacterPowerRecord = CharacterRecord['powers'][number];

type CharacterPowerUpdate = {
  id: string;
  name: string;
  powers: CharacterPowerRecord[];
  changedTypes: string[];
};

const shouldApply = process.argv.includes('--apply');

function normalizeCharacterPowers(character: CharacterRecord): CharacterPowerUpdate | null
{
  const normalizedPowers = character.powers.map((power) => {
    const normalizedType = normalizePowerType(power.type);

    if (normalizedType === power.type)
    {
      return power;
    }

    return {
      ...power,
      type: normalizedType,
    };
  });

  const changedTypes = character.powers.flatMap((power, index) => {
    const normalizedType = normalizedPowers[index].type;
    return normalizedType === power.type ? [] : [`${power.name}: ${power.type} -> ${normalizedType}`];
  });

  if (changedTypes.length === 0)
  {
    return null;
  }

  return {
    id: character.id,
    name: character.name,
    powers: normalizedPowers,
    changedTypes,
  };
}

async function main(): Promise<void>
{
  const characters = await fetchCharacters();
  const updates = characters
    .map(normalizeCharacterPowers)
    .filter((update): update is CharacterPowerUpdate => update !== null);

  console.log(`Scanned ${characters.length} characters.`);
  console.log(`Found ${updates.length} characters with legacy power types.`);

  if (updates.length === 0)
  {
    return;
  }

  for (const update of updates)
  {
    console.log(`- ${update.name} (${update.id})`);
    for (const changedType of update.changedTypes)
    {
      console.log(`  ${changedType}`);
    }
  }

  if (!shouldApply)
  {
    console.log('Dry run only. Re-run with --apply to persist the normalized power types.');
    return;
  }

  for (const update of updates)
  {
    await prisma.character.update({
      where: { id: update.id },
      data: { powers: update.powers },
    });
  }

  console.log(`Updated ${updates.length} characters.`);
}

main()
  .catch((error) => {
    console.error('Power type backfill failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
