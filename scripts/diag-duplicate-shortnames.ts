/**
 * Diagnostic (read-only, no writes): lists records that collide against
 * every pre-existing `@unique`/`@@unique` constraint in prisma/schema.prisma
 * — the reason `npx prisma db push` fails to (re)build these indexes.
 *
 * This is unrelated to the Battle Presets feature (see
 * features-to-implement/battle-configurations-implementation-plan.md); all
 * of these constraints predate that work. It looks like `db push` is being
 * run end-to-end against this database for the first time, so it's
 * surfacing every pre-existing violation it finds, one collection at a
 * time (each `db push` run stops at the first collision it hits — see the
 * `characters_shortName_key` then `spells_name_grade_key` errors). Running
 * this script once finds all of them up front instead of fixing-and-retrying
 * collection by collection.
 *
 * Checked constraints:
 *   - Character.shortName, Character.name (single-field @unique)
 *   - Race.name (single-field @unique)
 *   - Stance / State / Maneuver / Perk / Spell: (name, grade) composite @@unique
 *
 * Fixing the data (renaming/merging/deleting one side of each duplicate) is
 * a product decision, not something this script does automatically — decide
 * per pair what's correct, fix it (via the app UI or a targeted
 * `prisma.<model>.update`), then retry `npx prisma db push`.
 *
 * Usage:
 *   npx tsx scripts/diag-duplicate-shortnames.ts
 */

import prisma from '../src/lib/prisma';

type SingleFieldCheck = { model: keyof typeof prisma; field: string };
type CompositeGradeCheck = { model: keyof typeof prisma };

const singleFieldChecks: SingleFieldCheck[] = [
  { model: 'character', field: 'shortName' },
  { model: 'character', field: 'name' },
  { model: 'race', field: 'name' },
];

// (name, grade) is @@unique on all five of these models.
const compositeGradeChecks: CompositeGradeCheck[] = [
  { model: 'stance' },
  { model: 'state' },
  { model: 'maneuver' },
  { model: 'perk' },
  { model: 'spell' },
];

async function reportSingleFieldDuplicates({ model, field }: SingleFieldCheck): Promise<number>
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = prisma[model] as any;

  const grouped = await delegate.groupBy({
    by: [field],
    _count: { [field]: true },
    having: { [field]: { _count: { gt: 1 } } },
  });

  if (grouped.length === 0)
  {
    console.log(`✅ ${String(model)}.${field}: no duplicates.`);
    return 0;
  }

  console.log(`⚠️  ${String(model)}.${field}: ${grouped.length} duplicate value(s):`);

  for (const group of grouped)
  {
    const value = group[field];
    const rows = await delegate.findMany({ where: { [field]: value }, select: { id: true, name: true } });

    console.log(`  "${value}":`);
    for (const row of rows)
    {
      console.log(`    - id=${row.id} name="${row.name}"`);
    }
  }

  return grouped.length;
}

async function reportCompositeGradeDuplicates({ model }: CompositeGradeCheck): Promise<number>
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const delegate = prisma[model] as any;

  const grouped = await delegate.groupBy({
    by: ['name', 'grade'],
    _count: { name: true },
    having: { name: { _count: { gt: 1 } } },
  });

  if (grouped.length === 0)
  {
    console.log(`✅ ${String(model)}.(name, grade): no duplicates.`);
    return 0;
  }

  console.log(`⚠️  ${String(model)}.(name, grade): ${grouped.length} duplicate pair(s):`);

  for (const group of grouped)
  {
    const rows = await delegate.findMany({
      where: { name: group.name, grade: group.grade },
      select: { id: true, name: true, grade: true },
    });

    console.log(`  ("${group.name}", grade ${group.grade}):`);
    for (const row of rows)
    {
      console.log(`    - id=${row.id} name="${row.name}" grade=${row.grade}`);
    }
  }

  return grouped.length;
}

async function main(): Promise<void>
{
  let totalDuplicateGroups = 0;

  for (const check of singleFieldChecks)
  {
    totalDuplicateGroups += await reportSingleFieldDuplicates(check);
  }

  for (const check of compositeGradeChecks)
  {
    totalDuplicateGroups += await reportCompositeGradeDuplicates(check);
  }

  if (totalDuplicateGroups > 0)
  {
    console.log('');
    console.log(`Found ${totalDuplicateGroups} colliding group(s) across the constraints above.`);
    console.log('These collide with @unique/@@unique constraints already declared in');
    console.log('prisma/schema.prisma (predating Battle Presets). Resolve each one (rename,');
    console.log('merge, or delete one side), then re-run `npx prisma db push`.');
    process.exitCode = 1;
  }
  else
  {
    console.log('');
    console.log('✅ No violations found for any checked constraint — `db push` should succeed.');
  }
}

main()
  .catch((error) => {
    console.error('Diagnostic failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
