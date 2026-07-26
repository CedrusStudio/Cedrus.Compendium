/**
 * Wave 5 (5.4.1), rewritten for Wave 6.1 — 1:1 backfill of legacy free-text
 * requirements into `structuredRequirements` as `rankless` entries.
 *
 * WHY THE REWRITE: the original read `findMany({ select: { requirements: true } })`.
 * Faza 4c-full removed `requirements` from `schema.prisma`, so that no longer
 * compiles and would not see the data anyway. The field still exists in Mongo
 * (schemaless), so this now reads through `findRaw` and writes through the
 * normal typed `update` — `structuredRequirements` IS in the schema, so the
 * write stays type-checked.
 *
 * Fully automatic, lossless, idempotent: it APPENDS a `rankless` entry for every
 * legacy text nothing structured accounts for, and never touches the entries a
 * human already mapped to `ranked` in `/admin/requirements`.
 *
 * The append (rather than "fill only when the record has nothing structured") is
 * what `Pogromienie` forced: it holds one legacy text, "Większy Fechtunek 2",
 * and one structured entry that means something else entirely
 * (`characteristics/strength ≥ 2`). A record-level emptiness check calls that
 * record migrated and skips it forever, so the text never reaches the UI. The
 * coverage test is per text — see `findUncoveredLegacyTexts`.
 *
 * Run `npm run backup-mongodb` first — the legacy text is the only copy.
 *
 * Dry run (default — prints what would change, writes nothing):
 *   npm run backfill-requirements
 * Apply changes:
 *   npm run backfill-requirements:apply
 *
 * Do NOT rely on `npm run backfill-requirements -- --apply`: in PowerShell the
 * `--` separator is swallowed before npm sees it, the flag never reaches the
 * script, and the run silently stays a dry run. Hence the dedicated `:apply`
 * script — verify with `npm run diag-requirements`, which prints `process.argv`.
 *
 * Use the npm script (tsx): `node --experimental-strip-types` does not resolve
 * the `@/` alias used by the transitive domain imports.
 */

import prisma from '../src/lib/prisma';
import type { Requirement } from '../src/domain/requirements/Requirement';
import { formatRequirement } from '../src/domain/requirements/formatRequirement';
import {
  findUncoveredLegacyTexts,
  planBackfill,
  readStructuredRequirements,
} from '../src/domain/requirements/legacyRequirementAudit';

/** Raw read (the only way to see `requirements`) + typed write of the new field. */
type RequirementDelegate = {
  findRaw: (args: { filter?: Record<string, unknown>; options?: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: { id: string }; data: { structuredRequirements: Requirement[] } }) => Promise<{ id: string }>;
};

type RawDoc = { _id?: unknown; name?: unknown; requirements?: unknown; structuredRequirements?: unknown };

const collections: ReadonlyArray<{ label: string; delegate: RequirementDelegate }> = [
  { label: 'perks', delegate: prisma.perk as unknown as RequirementDelegate },
  { label: 'spells', delegate: prisma.spell as unknown as RequirementDelegate },
  { label: 'maneuvers', delegate: prisma.maneuver as unknown as RequirementDelegate },
  { label: 'stances', delegate: prisma.stance as unknown as RequirementDelegate },
  { label: 'states', delegate: prisma.state as unknown as RequirementDelegate },
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

async function backfillCollection(label: string, delegate: RequirementDelegate): Promise<number>
{
  const raw = await delegate.findRaw({
    filter: { requirements: { $exists: true, $ne: [] } },
    options: { projection: { name: 1, requirements: 1, structuredRequirements: 1 }, sort: { name: 1 } },
  });

  const records = Array.isArray(raw) ? (raw as RawDoc[]) : [];
  let updated = 0;

  for (const record of records)
  {
    const next = planBackfill(record);
    if (!next) continue;

    updated += 1;
    const existing = readStructuredRequirements(record);
    const added = findUncoveredLegacyTexts(record);
    const keeps = existing.length > 0 ? ` (zachowuje: ${existing.map(formatRequirement).join(', ')})` : '';
    console.log(`  - ${docName(record)} (${docId(record)}): dodaje ${added.map((text) => `"${text}"`).join(', ')}${keeps}`);

    // A record whose structured array holds unreadable junk would lose it here,
    // since `planBackfill` rebuilds from the parsed entries. Say so out loud.
    const rawLength = Array.isArray(record.structuredRequirements) ? record.structuredRequirements.length : 0;
    if (rawLength > existing.length)
    {
      console.log(`    UWAGA: pomija ${rawLength - existing.length} niepoprawn(y/e) wpis(y) structuredRequirements.`);
    }

    if (shouldApply)
    {
      await delegate.update({ where: { id: docId(record) }, data: { structuredRequirements: next } });
    }
  }

  console.log(`\n[${label}] z legacy: ${records.length}, do backfillu: ${updated}.`);
  return updated;
}

async function main(): Promise<void>
{
  let total = 0;

  for (const { label, delegate } of collections)
  {
    total += await backfillCollection(label, delegate);
  }

  console.log(`\nŁącznie rekordów ${shouldApply ? 'zaktualizowanych' : 'do aktualizacji'}: ${total}.`);

  if (!shouldApply)
  {
    console.log('DRY RUN — nic nie zapisano. Żeby zapisać: npm run backfill-requirements:apply');
    return;
  }

  console.log('Zweryfikuj: npm run audit-legacy-requirements  (powinno pokazać 0 osieroconych).');
}

main()
  .catch((error) => {
    console.error('Backfill wymagań nie powiódł się.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
