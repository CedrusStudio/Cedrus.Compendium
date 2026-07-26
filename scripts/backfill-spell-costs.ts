/**
 * Normalize structured spell-cost fields.
 *
 * The legacy `cost Int` column has been retired. Every spell now stores its
 * cost purely via costBase / costScalingMode / costScalingValue / costRounding.
 * This script repairs any spell whose structured fields are missing or invalid
 * by re-normalizing them to the canonical form (defaults applied where needed).
 *
 * Dry run:
 *   npm run backfill-spell-costs
 *
 * Apply changes:
 *   npm run backfill-spell-costs -- --apply
 */

import prisma from '../src/lib/prisma';
import { fromSpellCostPersistence, toSpellCostPersistence } from '../src/domain/characters/combat/SpellCost';

const shouldApply = process.argv.includes('--apply');

async function fetchSpells()
{
  return prisma.spell.findMany({
    select:
    {
      id: true,
      name: true,
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

function needsNormalization(spell: SpellRecord): boolean
{
  return (
    spell.costBase == null ||
    spell.costScalingMode == null ||
    spell.costScalingValue == null ||
    spell.costRounding == null
  );
}

async function main(): Promise<void>
{
  const spells = await fetchSpells();
  const updates = spells.filter(needsNormalization);

  console.log(`Scanned ${spells.length} spells.`);
  console.log(`Found ${updates.length} spells requiring spell-cost normalization.`);

  if (updates.length === 0)
  {
    return;
  }

  for (const spell of updates)
  {
    const normalized = toSpellCostPersistence(fromSpellCostPersistence(spell));
    console.log(`- ${spell.name} (${spell.id}) -> ${normalized.costBase} [${normalized.costScalingMode}]`);

    if (shouldApply)
    {
      await prisma.spell.update({
        where: { id: spell.id },
        data: normalized,
      });
    }
  }

  console.log(shouldApply
    ? `Updated ${updates.length} spells.`
    : 'Dry run only. Re-run with --apply to persist normalized spell costs.');
}

main()
  .catch((error) => {
    console.error('Spell cost normalization failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
