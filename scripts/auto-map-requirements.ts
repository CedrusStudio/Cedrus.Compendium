/**
 * Wave 5 (follow-up) — opinionated auto-mapping of `rankless` structured
 * requirements to `ranked` using the suggestion matcher, so the compendium can
 * be filtered by requirement value + name. Runs AFTER the 1:1 backfill.
 *
 * For every `rankless` entry in `structuredRequirements` it asks
 * `suggestRequirementMapping` for a confident `ranked` guess (stat/attribute by
 * label, or a Kompendium entity by exact name) and, if found, replaces the
 * entry. Anything uncertain stays `rankless` (safe fallback). Already-`ranked`
 * entries are left untouched, so the script is idempotent and re-runnable.
 *
 * Wave 6.1 fix: the legacy `requirements` column was dropped from
 * `schema.prisma`, so selecting it here threw at runtime. This now reads
 * `structuredRequirements` only — run `npm run backfill-requirements -- --apply`
 * first so every record actually has its texts as `rankless` entries.
 *
 * Review the result with `npm run audit-legacy-requirements`: the matcher is
 * conservative but not infallible, and a wrong `ranked` target silently changes
 * what the compendium filter returns.
 *
 * Dry run (default):
 *   npm run auto-map-requirements
 * Apply:
 *   npm run auto-map-requirements:apply
 *
 * (PowerShell eats the `--` in `npm run x -- --apply`, so the flag never reaches
 * the script and the run stays a dry run — use the `:apply` script.)
 */

import prisma from '../src/lib/prisma';
import { suggestRequirementMapping, type EntityNameOptions } from '../src/domain/requirements/suggestRequirementMapping';
import type { Requirement } from '../src/domain/requirements/Requirement';
import { formatRequirement } from '../src/domain/requirements/formatRequirement';
import { readStructuredRequirements } from '../src/domain/requirements/legacyRequirementAudit';

type RequirementDelegate = {
  findMany: (args: {
    select: { id: true; name: true; structuredRequirements: true };
    orderBy: { name: 'asc' };
  }) => Promise<Array<{ id: string; name: string; structuredRequirements: unknown }>>;
  update: (args: { where: { id: string }; data: { structuredRequirements: Requirement[] } }) => Promise<{ id: string }>;
};

type NameDelegate = { findMany: (args: { select: { name: true } }) => Promise<Array<{ name: string }>> };

const collections: ReadonlyArray<{ label: keyof EntityNameOptions; delegate: RequirementDelegate }> = [
  { label: 'perks', delegate: prisma.perk as unknown as RequirementDelegate },
  { label: 'spells', delegate: prisma.spell as unknown as RequirementDelegate },
  { label: 'maneuvers', delegate: prisma.maneuver as unknown as RequirementDelegate },
  { label: 'stances', delegate: prisma.stance as unknown as RequirementDelegate },
  { label: 'states', delegate: prisma.state as unknown as RequirementDelegate },
];

const shouldApply = process.argv.includes('--apply');

/** Map each rankless entry through the matcher; returns null if nothing changed. */
export function autoMapRequirements(current: Requirement[], entityNames: EntityNameOptions): Requirement[] | null
{
  let changed = false;

  const mapped = current.map((requirement) => {
    if (requirement.kind !== 'rankless')
    {
      return requirement;
    }

    const suggestion = suggestRequirementMapping(requirement.text, entityNames);
    if (suggestion)
    {
      changed = true;
      return suggestion;
    }

    return requirement;
  });

  return changed ? mapped : null;
}

async function fetchEntityNames(): Promise<EntityNameOptions>
{
  const [perks, spells, maneuvers, stances, states] = await Promise.all([
    (prisma.perk as unknown as NameDelegate).findMany({ select: { name: true } }),
    (prisma.spell as unknown as NameDelegate).findMany({ select: { name: true } }),
    (prisma.maneuver as unknown as NameDelegate).findMany({ select: { name: true } }),
    (prisma.stance as unknown as NameDelegate).findMany({ select: { name: true } }),
    (prisma.state as unknown as NameDelegate).findMany({ select: { name: true } }),
  ]);

  const names = (rows: Array<{ name: string }>) => Array.from(new Set(rows.map((r) => r.name)));

  return {
    perks: names(perks),
    spells: names(spells),
    maneuvers: names(maneuvers),
    stances: names(stances),
    states: names(states),
  };
}

function describe(requirement: Requirement): string
{
  // The script only ever produces `rankless` → `ranked`, but `Requirement` has
  // composite variants too; render them through the shared formatter rather
  // than assuming a shape.
  return requirement.kind === 'ranked'
    ? `${requirement.group}/${requirement.targetKey} ≥ ${requirement.value}`
    : `"${formatRequirement(requirement)}"`;
}

async function main(): Promise<void>
{
  const entityNames = await fetchEntityNames();
  let total = 0;

  for (const { label, delegate } of collections)
  {
    const records = await delegate.findMany({
      select: { id: true, name: true, structuredRequirements: true },
      orderBy: { name: 'asc' },
    });

    let mappedCount = 0;

    for (const record of records)
    {
      const current = readStructuredRequirements(record);
      const next = autoMapRequirements(current, entityNames);
      if (!next) continue;

      mappedCount += 1;
      const ranked = next.filter((r) => r.kind === 'ranked');
      console.log(`  [${label}] ${record.name} (${record.id}): ${ranked.map(describe).join(', ')}`);

      if (shouldApply)
      {
        await delegate.update({ where: { id: record.id }, data: { structuredRequirements: next } });
      }
    }

    console.log(`[${label}] scanned ${records.length}, auto-mapped ${mappedCount}.`);
    total += mappedCount;
  }

  console.log(`\nTotal records ${shouldApply ? 'updated' : 'to update'}: ${total}.`);
  if (!shouldApply)
  {
    console.log('DRY RUN — nic nie zapisano. Żeby zapisać: npm run auto-map-requirements:apply');
  }
}

main()
  .catch((error) => {
    console.error('Auto-map requirements failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
