/**
 * Backfill legacy spell costs to the new structured cost fields.
 *
 * Dry run:
 *   npx tsx scripts/backfill-spell-costs.ts
 *
 * Apply changes:
 *   npx tsx scripts/backfill-spell-costs.ts --apply
 */

import prisma from '../src/lib/prisma';
import { toSpellCostPersistence } from '../src/domain/characters/combat/SpellCost';

const shouldApply = process.argv.includes('--apply');

async function fetchSpells()
{
  return prisma.spell.findMany({
    select:
    {
      id: true,
      name: true,
      cost: true,
      costBase: true,
      costScalingMode: true,
      costScalingValue: true,
      costRounding: true,
    },
    orderBy:
    {
      name: 'asc',
    },
  });
}

type SpellRecord = Awaited<ReturnType<typeof fetchSpells>>[number];

type SpellCostUpdate = {
  id: string;
  name: string;
  cost: number;
  costBase: number;
  costScalingMode: string;
  costScalingValue: number;
  costRounding: string;
};

function normalizeSpell(spell: SpellRecord): SpellCostUpdate | null
{
  if (spell.costBase != null && spell.costScalingMode && spell.costScalingValue != null && spell.costRounding)
  {
    return null;
  }

  return {
    id: spell.id,
    name: spell.name,
    ...toSpellCostPersistence(spell.cost),
  };
}

async function main(): Promise<void>
{
  const spells = await fetchSpells();
  const updates = spells
    .map(normalizeSpell)
    .filter((update): update is SpellCostUpdate => update !== null);

  console.log(`Scanned ${spells.length} spells.`);
  console.log(`Found ${updates.length} spells requiring spell-cost backfill.`);

  if (updates.length === 0)
  {
    return;
  }

  for (const update of updates)
  {
    console.log(`- ${update.name} (${update.id}) -> ${update.costBase} [${update.costScalingMode}]`);
  }

  if (!shouldApply)
  {
    console.log('Dry run only. Re-run with --apply to persist structured spell costs.');
    return;
  }

  for (const update of updates)
  {
    await prisma.spell.update({
      where: { id: update.id },
      data:
      {
        cost: update.cost,
        costBase: update.costBase,
        costScalingMode: update.costScalingMode,
        costScalingValue: update.costScalingValue,
        costRounding: update.costRounding,
      },
    });
  }

  console.log(`Updated ${updates.length} spells.`);
}

main()
  .catch((error) => {
    console.error('Spell cost backfill failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });