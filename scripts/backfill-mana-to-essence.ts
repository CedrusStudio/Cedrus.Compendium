/**
 * Backfill: remove the legacy "mana" resource from stored combat-lab effects.
 *
 * The system operates only on Esencja. Historically a maneuver/stance/state
 * could carry effects tagged `resource: "mana"` (e.g. a `resource` effect, a
 * `hasResource` condition, or a `selfResource` scale source) — notably produced
 * by scripts/classify-maneuvers.ts before that branch was removed. This script
 * rewrites every stored `"mana"` resource to `"essence"` inside the `effects`
 * JSON of the maneuvers / stances / states collections.
 *
 * The runtime schema (src/domain/combat-lab/effects/effectSchema.ts) already
 * normalizes "mana" -> "essence" on read, so this backfill is about persisting
 * the clean data; it is idempotent and safe to re-run.
 *
 * Dry run (report only):
 *   node --experimental-strip-types scripts/backfill-mana-to-essence.ts
 *
 * Apply changes:
 *   node --experimental-strip-types scripts/backfill-mana-to-essence.ts --apply
 */

import prisma from '../src/lib/prisma';

const shouldApply = process.argv.includes('--apply');

/**
 * Recursively rewrite `resource: "mana"` -> `resource: "essence"` anywhere in a
 * JSON value. Returns the (possibly new) value and the number of replacements.
 */
function rewriteMana(value: unknown): { value: unknown; replaced: number }
{
  if (Array.isArray(value))
  {
    let replaced = 0;
    const next = value.map((item) =>
    {
      const r = rewriteMana(item);
      replaced += r.replaced;
      return r.value;
    });
    return { value: next, replaced };
  }

  if (value !== null && typeof value === 'object')
  {
    let replaced = 0;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>))
    {
      if (key === 'resource' && val === 'mana')
      {
        next[key] = 'essence';
        replaced += 1;
        continue;
      }
      const r = rewriteMana(val);
      replaced += r.replaced;
      next[key] = r.value;
    }
    return { value: next, replaced };
  }

  return { value, replaced: 0 };
}

type Collection = 'maneuver' | 'stance' | 'state';

type Row = { id: string; name: string; grade: number; effects: unknown };

async function fetchRows(collection: Collection): Promise<Row[]>
{
  const select = { id: true, name: true, grade: true, effects: true } as const;
  if (collection === 'maneuver') return prisma.maneuver.findMany({ select, orderBy: { name: 'asc' } });
  if (collection === 'stance') return prisma.stance.findMany({ select, orderBy: { name: 'asc' } });
  return prisma.state.findMany({ select, orderBy: { name: 'asc' } });
}

async function persist(collection: Collection, id: string, effects: unknown): Promise<void>
{
  const data = { effects: effects as never };
  if (collection === 'maneuver') { await prisma.maneuver.update({ where: { id }, data }); return; }
  if (collection === 'stance') { await prisma.stance.update({ where: { id }, data }); return; }
  await prisma.state.update({ where: { id }, data });
}

async function processCollection(collection: Collection): Promise<number>
{
  const rows = await fetchRows(collection);
  let changed = 0;
  let totalReplacements = 0;

  for (const row of rows)
  {
    if (row.effects == null) continue;
    const { value, replaced } = rewriteMana(row.effects);
    if (replaced === 0) continue;

    changed += 1;
    totalReplacements += replaced;
    console.log(`- [${collection}] ${row.name} (rank ${row.grade}, ${row.id}) -> ${replaced} "mana" reference(s)`);

    if (shouldApply)
    {
      await persist(collection, row.id, value);
    }
  }

  console.log(`Scanned ${rows.length} ${collection}(s); ${changed} needed backfill (${totalReplacements} replacement(s)).`);
  return changed;
}

async function main(): Promise<void>
{
  let changed = 0;
  for (const collection of ['maneuver', 'stance', 'state'] as const)
  {
    changed += await processCollection(collection);
  }

  if (changed === 0)
  {
    console.log('\nNothing to backfill — no legacy "mana" resources found.');
    return;
  }

  if (!shouldApply)
  {
    console.log('\nDry run only. Re-run with --apply to persist "mana" -> "essence".');
  }
  else
  {
    console.log(`\nApplied "mana" -> "essence" across ${changed} record(s).`);
  }
}

main()
  .catch((error) => {
    console.error('Mana -> essence backfill failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
