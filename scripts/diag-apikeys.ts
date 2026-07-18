/**
 * Diagnostic (read-only, no writes): checks whether Prisma's `isEmpty: true`
 * filter — the one used in src/persistence/characterVisibility.ts to decide
 * whether a character is "public" — actually matches characters whose
 * `apiKeys` field is entirely missing from the underlying MongoDB document
 * (as opposed to explicitly stored as `[]`).
 *
 * Why this matters: `findMany({ select: { apiKeys: true } })` normalizes a
 * missing array field to `[]` in the JS result (that's why the backfill
 * script reports 0 legacy records to fix), but that JS-level normalization
 * is a *read* behavior. The *where* clause `{ apiKeys: { isEmpty: true } }`
 * compiles to a raw Mongo `{ apiKeys: { $size: 0 } }` filter, which is a
 * different code path — `$size: 0` requires the field to exist. If it
 * doesn't, older docs without the field could be silently excluded from
 * "public" search results even though they read back fine individually.
 *
 * Usage:
 *   npx tsx scripts/diag-apikeys.ts
 */

import prisma from '../src/lib/prisma';

async function main(): Promise<void>
{
  const total = await prisma.character.count();
  const matchedByIsEmptyFilter = await prisma.character.count({ where: { apiKeys: { isEmpty: true } } });
  const matchedByHasKeys = await prisma.character.count({ where: { NOT: { apiKeys: { isEmpty: true } } } });

  console.log(`Total characters: ${total}`);
  console.log(`Matched by { apiKeys: { isEmpty: true } } (treated as public): ${matchedByIsEmptyFilter}`);
  console.log(`Matched by NOT isEmpty (have at least one key): ${matchedByHasKeys}`);
  console.log(`Sum: ${matchedByIsEmptyFilter + matchedByHasKeys} (should equal total: ${total})`);

  if (matchedByIsEmptyFilter + matchedByHasKeys !== total)
  {
    const missing = total - (matchedByIsEmptyFilter + matchedByHasKeys);
    console.log('');
    console.log(`⚠️  ${missing} character(s) matched NEITHER filter.`);
    console.log('This confirms the suspected bug: characters whose apiKeys field is');
    console.log('entirely missing in MongoDB are invisible to both the "public" and');
    console.log('"has keys" where-clauses, because Mongo\'s $size operator (used by');
    console.log('Prisma\'s isEmpty filter) requires the field to exist.');
    console.log('Fix: run `npm run backfill-character-api-keys -- --apply` again after');
    console.log('confirming this — it should explicitly set apiKeys: [] on those docs,');
    console.log('which makes them match $size: 0 going forward.');
  }
  else
  {
    console.log('');
    console.log('✅ No gap — every character is matched by exactly one of the two filters.');
    console.log('The isEmpty filter correctly treats missing-field documents as public.');
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
