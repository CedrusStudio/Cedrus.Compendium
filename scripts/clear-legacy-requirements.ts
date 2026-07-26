/**
 * Wave 5 (Faza 3), rewritten for Wave 6.1 — remove the legacy `requirements`
 * field from records already migrated to `structuredRequirements`.
 *
 * WHY THE REWRITE: the original used a typed `findMany`/`update` on
 * `requirements`, which Faza 4c-full removed from `schema.prisma`. The field is
 * still physically present in Mongo, so this reads with `findRaw` and deletes
 * with `$runCommandRaw` + `$unset` — a real removal, not `requirements: []`,
 * because the column no longer exists as far as Prisma is concerned.
 *
 * SAFETY: a record is only cleared when EVERY legacy text is accounted for by a
 * structured entry. Records that are `orphaned` (nothing structured) or `partial`
 * (structured entries exist but do not cover every text — the `Pogromienie`
 * shape) are SKIPPED and reported; clearing those would destroy the wording for
 * good. Run `npm run backfill-requirements -- --apply` first, and confirm with
 * `npm run audit-legacy-requirements` that both counts are 0.
 *
 * Run `npm run backup-mongodb` first. This step is irreversible.
 *
 * Dry run (default):
 *   npm run clear-legacy-requirements
 * Apply:
 *   npm run clear-legacy-requirements:apply
 *
 * (PowerShell eats the `--` in `npm run x -- --apply`, so the flag never reaches
 * the script and the run stays a dry run — use the `:apply` script.)
 *
 * Use the npm script (tsx): `node --experimental-strip-types` does not resolve
 * the `@/` alias used by the transitive domain imports.
 */

import prisma from '../src/lib/prisma';
import {
  classifyLegacyRecord,
  findUncoveredLegacyTexts,
  readLegacyTexts,
} from '../src/domain/requirements/legacyRequirementAudit';

type RawDelegate = {
  findRaw: (args: { filter?: Record<string, unknown>; options?: Record<string, unknown> }) => Promise<unknown>;
};

type RawDoc = { _id?: unknown; name?: unknown; requirements?: unknown; structuredRequirements?: unknown };

/** `collection` is the Mongo name from `@@map` — `$runCommandRaw` bypasses Prisma's model naming. */
const collections: ReadonlyArray<{ label: string; collection: string; delegate: RawDelegate }> = [
  { label: 'perks', collection: 'perks', delegate: prisma.perk as unknown as RawDelegate },
  { label: 'spells', collection: 'spells', delegate: prisma.spell as unknown as RawDelegate },
  { label: 'maneuvers', collection: 'maneuvers', delegate: prisma.maneuver as unknown as RawDelegate },
  { label: 'stances', collection: 'stances', delegate: prisma.stance as unknown as RawDelegate },
  { label: 'states', collection: 'states', delegate: prisma.state as unknown as RawDelegate },
];

const shouldApply = process.argv.includes('--apply');

function docId(doc: RawDoc): string
{
  const id = doc._id;
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && '$oid' in id) return String((id as { $oid: unknown }).$oid);
  return String(id ?? '');
}

function docName(doc: RawDoc): string
{
  return typeof doc.name === 'string' ? doc.name : '(bez nazwy)';
}

async function clearCollection(label: string, collection: string, delegate: RawDelegate): Promise<{ cleared: number; skipped: number }>
{
  const raw = await delegate.findRaw({
    filter: { requirements: { $exists: true, $ne: [] } },
    options: { projection: { name: 1, requirements: 1, structuredRequirements: 1 }, sort: { name: 1 } },
  });

  const records = Array.isArray(raw) ? (raw as RawDoc[]) : [];
  const clearable: RawDoc[] = [];
  let skipped = 0;

  for (const record of records)
  {
    const bucket = classifyLegacyRecord(record);

    if (bucket === 'orphaned' || bucket === 'partial')
    {
      skipped += 1;
      const uncovered = findUncoveredLegacyTexts(record);
      const why = bucket === 'orphaned' ? 'brak structured' : 'structured nie pokrywa całego tekstu';
      console.log(`  [${label}] POMIJAM (${why} — usunięcie skasowałoby wymaganie): ${docName(record)} (${docId(record)}) → niepokryte: ${JSON.stringify(uncovered)} z ${JSON.stringify(readLegacyTexts(record))}`);
      continue;
    }

    clearable.push(record);
    console.log(`  [${label}] usuwam legacy: ${docName(record)} (${docId(record)}) — ${readLegacyTexts(record).length} wpis(ów)`);
  }

  if (shouldApply && clearable.length > 0)
  {
    // One command per collection: unset the field on exactly the ids we vetted
    // above, rather than re-deriving the condition inside Mongo.
    await prisma.$runCommandRaw({
      update: collection,
      updates: [{
        q: { _id: { $in: clearable.map(docId) } },
        u: { $unset: { requirements: '' } },
        multi: true,
      }],
    });
  }

  console.log(`[${label}] z legacy: ${records.length}, do usunięcia: ${clearable.length}, pominięto: ${skipped}.`);
  return { cleared: clearable.length, skipped };
}

async function main(): Promise<void>
{
  let totalCleared = 0;
  let totalSkipped = 0;

  for (const { label, collection, delegate } of collections)
  {
    const { cleared, skipped } = await clearCollection(label, collection, delegate);
    totalCleared += cleared;
    totalSkipped += skipped;
  }

  console.log(`\nŁącznie ${shouldApply ? 'usuniętych' : 'do usunięcia'}: ${totalCleared}. Pominiętych (niepokryty tekst legacy): ${totalSkipped}.`);

  if (totalSkipped > 0)
  {
    console.log('UWAGA: pominięte rekordy nadal mają wymagania niewidoczne w UI — uruchom najpierw npm run backfill-requirements -- --apply.');
  }

  if (!shouldApply)
  {
    console.log('DRY RUN — nic nie usunięto. Żeby usunąć: npm run clear-legacy-requirements:apply');
  }
}

main()
  .catch((error) => {
    console.error('Czyszczenie legacy requirements nie powiodło się.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
