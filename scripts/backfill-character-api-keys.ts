/**
 * Backfill legacy `apiKeys` values on characters to a consistent empty array.
 *
 * Old records may have `apiKeys` missing entirely from the MongoDB document
 * (MongoDB is schemaless, so Prisma's `@default([])` only applies to newly
 * created rows). The visibility filter (`src/persistence/characterVisibility.ts`)
 * relies on `apiKeys: { isEmpty: true }`, which Prisma compiles to a raw Mongo
 * `{ apiKeys: { $size: 0 } }` filter — and `$size` requires the field to
 * exist, so documents missing it entirely do NOT match and would be silently
 * excluded from "public" search results.
 *
 * Important: `prisma.character.findMany({ select: { apiKeys: true } })`
 * cannot be used to detect this. Prisma's typed client normalizes a missing
 * array field to `[]` in the JS result — a genuinely-missing field and an
 * explicitly-stored `[]` both read back identically as `[]`. That's a *read*
 * behavior only; it does not change what's actually stored in Mongo, and it
 * does not affect how `$size: 0` evaluates against the raw document. So this
 * script uses a raw aggregation (`$exists: false`) to find the real legacy
 * records instead.
 *
 * Dry run (default, does not write anything):
 *   npx tsx scripts/backfill-character-api-keys.ts
 *
 * Apply changes:
 *   npx tsx scripts/backfill-character-api-keys.ts --apply
 *
 * See also: scripts/diag-apikeys.ts, which reports the size of this gap
 * without changing anything.
 */

import prisma from '../src/lib/prisma';

const shouldApply = process.argv.includes('--apply');

type RawCharacterId =
{
  _id: { $oid: string } | string;
  name: string;
};

function extractId(rawId: RawCharacterId['_id']): string
{
  return typeof rawId === 'string' ? rawId : rawId.$oid;
}

async function main(): Promise<void>
{
  // Diagnostic step (see features-to-implement doc, Krok 1): inspect the real
  // shape of the data before deciding anything, using a raw query so a
  // genuinely-missing field isn't masked by Prisma's read-time normalization.
  const totalCount = await prisma.character.count();

  const legacyDocs = await prisma.character.aggregateRaw
  ({
    pipeline:
    [
      { $match: { apiKeys: { $exists: false } } },
      { $project: { _id: 1, name: 1 } },
    ],
  }) as unknown as RawCharacterId[];

  const legacyRecords = legacyDocs.map(doc => ({ id: extractId(doc._id), name: doc.name }));

  console.log(`Scanned ${totalCount} characters.`);
  console.log(`Found ${legacyRecords.length} characters with a missing apiKeys field.`);

  if (legacyRecords.length === 0)
  {
    console.log('Nothing to backfill.');
    return;
  }

  for (const character of legacyRecords)
  {
    console.log(`- ${character.name} (${character.id}) -> apiKeys: []`);
  }

  // Debug aid: show the raw shape of the first matched _id, so a format
  // mismatch (e.g. not a bare 24-char hex ObjectId string) is visible
  // instead of causing a silent 0-match update below.
  console.log(`Sample raw _id shape: ${JSON.stringify(legacyDocs[0]?._id)} -> extracted: "${legacyRecords[0]?.id}"`);

  if (!shouldApply)
  {
    console.log('Dry run only. Re-run with --apply to persist the backfill.');
    return;
  }

  const ids = legacyRecords.map(character => character.id);

  const result = await prisma.character.updateMany({
    where: { id: { in: ids } },
    data: { apiKeys: [] },
  });

  console.log(`Updated ${result.count} characters.`);

  if (result.count !== legacyRecords.length)
  {
    console.warn(
      `⚠️  Expected to update ${legacyRecords.length} but updateMany reported ${result.count}. `
      + 'The extracted ids likely do not match the format Prisma expects for the `id` field '
      + '(see "Sample raw _id shape" above) — no changes were silently lost, but not all '
      + 'legacy records were fixed. Re-run this script to check the current state.',
    );
  }

  // Verify directly against the raw collection too, independent of Prisma's
  // typed filter, so a mismatch between "we think we updated" and "Mongo
  // actually has $exists: false docs left" is caught here rather than only
  // showing up later via diag-apikeys.ts.
  const remaining = await prisma.character.aggregateRaw({
    pipeline: [
      { $match: { apiKeys: { $exists: false } } },
      { $count: 'remaining' },
    ],
  }) as unknown as Array<{ remaining: number }>;

  const remainingCount = remaining[0]?.remaining ?? 0;
  console.log(`Characters still missing apiKeys after update: ${remainingCount}`);
}

main()
  .catch((error) => {
    console.error('Character apiKeys backfill failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
