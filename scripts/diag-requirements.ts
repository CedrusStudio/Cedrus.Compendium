/**
 * Wave 6.1 — read-only diagnostics for "the backfill ran but the audit still
 * reports records with invisible requirement text".
 *
 * Writes NOTHING. It answers, in order, the questions that separate the
 * plausible causes:
 *   1. did `--apply` even reach the script (argv passthrough)?
 *   2. which database are we actually talking to?
 *   3. does `findRaw` see the legacy field at all, and how do records classify?
 *   4. for one named record, what does the backfill intend to write?
 *   5. can a write to that record be read back? (only with --probe)
 *
 * Run:
 *   npm run diag-requirements
 *   npm run diag-requirements -- --name Pogromienie
 *   npm run diag-requirements -- --probe        # performs ONE real write, see below
 *
 * `--probe` is the only writing mode: it re-saves a single record's EXISTING
 * `structuredRequirements` (same value, no change in meaning) and reads it back,
 * to prove whether typed writes land in the database the audit reads.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import prisma from '../src/lib/prisma';
import { formatRequirement } from '../src/domain/requirements/formatRequirement';
import {
  classifyLegacyRecord,
  findUncoveredLegacyTexts,
  planBackfill,
  readLegacyTexts,
  readStructuredRequirements,
  type LegacyRequirementBucket,
} from '../src/domain/requirements/legacyRequirementAudit';

type RawDelegate = {
  findRaw: (args: { filter?: Record<string, unknown>; options?: Record<string, unknown> }) => Promise<unknown>;
  update: (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>;
};

type RawDoc = { _id?: unknown; name?: unknown; requirements?: unknown; structuredRequirements?: unknown };

const collections: ReadonlyArray<{ label: string; delegate: RawDelegate }> = [
  { label: 'perks', delegate: prisma.perk as unknown as RawDelegate },
  { label: 'spells', delegate: prisma.spell as unknown as RawDelegate },
  { label: 'maneuvers', delegate: prisma.maneuver as unknown as RawDelegate },
  { label: 'stances', delegate: prisma.stance as unknown as RawDelegate },
  { label: 'states', delegate: prisma.state as unknown as RawDelegate },
];

function argValue(flag: string): string | undefined
{
  const index = process.argv.indexOf(flag);
  return index === -1 ? undefined : process.argv[index + 1];
}

const nameFilter = argValue('--name') ?? 'Pogromienie';
const shouldProbe = process.argv.includes('--probe');

function docId(doc: RawDoc): string
{
  const id = doc._id;
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && '$oid' in id) return String((id as { $oid: unknown }).$oid);
  return String(id ?? '');
}

/**
 * Host + database only — never print credentials.
 *
 * Reads `.env` from disk rather than `process.env`: Prisma resolves the
 * connection string internally and does NOT export it to the environment, so
 * `process.env.DATABASE_URL` is empty here even though the client connects fine.
 */
function describeDatabase(): string
{
  const url = process.env.DATABASE_URL ?? readDatabaseUrlFromEnvFile();
  if (!url) return 'Nie znalazłem DATABASE_URL ani w process.env, ani w .env';

  try
  {
    const parsed = new URL(url);
    const database = parsed.pathname.replace(/^\//, '').split('?')[0] || '(brak nazwy w URL — Mongo użyje domyślnej)';
    return `${parsed.protocol}//${parsed.hostname} → baza "${database}"`;
  }
  catch
  {
    return 'DATABASE_URL nie parsuje się jako URL';
  }
}

function readDatabaseUrlFromEnvFile(): string | undefined
{
  try
  {
    const contents = readFileSync(join(process.cwd(), '.env'), 'utf8');
    const line = contents.split(/\r?\n/).find((entry) => entry.trimStart().startsWith('DATABASE_URL'));
    if (!line) return undefined;

    return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  }
  catch
  {
    return undefined;
  }
}

async function main(): Promise<void>
{
  console.log('=== 1. ARGUMENTY ===');
  console.log(`process.argv: ${JSON.stringify(process.argv.slice(2))}`);
  console.log(`Czy "--apply" przeszłoby do skryptu: ${process.argv.includes('--apply')}`);
  console.log('  (uruchom raz: npm run diag-requirements -- --apply, żeby sprawdzić przekazywanie flag przez npm)');

  console.log('\n=== 2. BAZA ===');
  console.log(describeDatabase());

  console.log('\n=== 3. LICZNIKI (przez findRaw) ===');
  const totals: Record<LegacyRequirementBucket, number> = { orphaned: 0, partial: 0, duplicated: 0, clean: 0 };

  for (const { label, delegate } of collections)
  {
    const all = await delegate.findRaw({
      filter: {},
      options: { projection: { name: 1, requirements: 1, structuredRequirements: 1 } },
    });
    const docs = Array.isArray(all) ? (all as RawDoc[]) : [];

    const withField = docs.filter((doc) => doc.requirements !== undefined).length;
    const withText = docs.filter((doc) => readLegacyTexts(doc).length > 0).length;
    const withStructured = docs.filter((doc) => readStructuredRequirements(doc).length > 0).length;

    const counts: Record<LegacyRequirementBucket, number> = { orphaned: 0, partial: 0, duplicated: 0, clean: 0 };
    for (const doc of docs)
    {
      const bucket = classifyLegacyRecord(doc);
      counts[bucket] += 1;
      totals[bucket] += 1;
    }

    console.log(`[${label}] dokumentów: ${docs.length} | pole requirements istnieje: ${withField} | niepusty tekst: ${withText} | ma structured: ${withStructured}`);
    console.log(`         osierocone: ${counts.orphaned}, częściowe: ${counts.partial}, zduplikowane: ${counts.duplicated}, czyste: ${counts.clean}`);
  }

  console.log(`\nRAZEM niewidoczne w UI (osierocone + częściowe): ${totals.orphaned + totals.partial}`);

  console.log(`\n=== 4. REKORD "${nameFilter}" ===`);
  let probeTarget: { delegate: RawDelegate; doc: RawDoc } | undefined;

  for (const { label, delegate } of collections)
  {
    const found = await delegate.findRaw({
      filter: { name: { $regex: nameFilter, $options: 'i' } },
      options: { projection: { name: 1, requirements: 1, structuredRequirements: 1 } },
    });
    const docs = Array.isArray(found) ? (found as RawDoc[]) : [];

    for (const doc of docs)
    {
      console.log(`\n[${label}] ${String(doc.name)} (${docId(doc)})`);
      console.log(`  requirements (surowe):           ${JSON.stringify(doc.requirements)}`);
      console.log(`  structuredRequirements (surowe): ${JSON.stringify(doc.structuredRequirements)}`);
      console.log(`  kubełek:                         ${classifyLegacyRecord(doc)}`);
      console.log(`  niepokryte teksty:               ${JSON.stringify(findUncoveredLegacyTexts(doc))}`);

      const plan = planBackfill(doc);
      console.log(`  backfill zapisałby:              ${plan ? plan.map(formatRequirement).join(' | ') : 'nic (wszystko pokryte)'}`);

      if (!probeTarget && readStructuredRequirements(doc).length > 0)
      {
        probeTarget = { delegate, doc };
      }
    }
  }

  if (!shouldProbe)
  {
    console.log('\n=== 5. TEST ZAPISU: pominięty ===');
    console.log('Dodaj --probe, żeby sprawdzić, czy typowany zapis w ogóle dociera do tej bazy.');
    return;
  }

  console.log('\n=== 5. TEST ZAPISU ===');

  if (!probeTarget)
  {
    console.log('Brak rekordu z niepustym structuredRequirements do przetestowania — podaj inny --name.');
    return;
  }

  const id = docId(probeTarget.doc);
  const current = readStructuredRequirements(probeTarget.doc);
  console.log(`Zapisuję ponownie TĘ SAMĄ wartość na ${String(probeTarget.doc.name)} (${id})…`);

  await probeTarget.delegate.update({ where: { id }, data: { structuredRequirements: current } });

  const after = await probeTarget.delegate.findRaw({
    filter: { _id: id },
    options: { projection: { structuredRequirements: 1 } },
  });
  const afterDoc = Array.isArray(after) ? (after as RawDoc[])[0] : undefined;

  console.log(`Odczyt po zapisie: ${JSON.stringify(afterDoc?.structuredRequirements)}`);
  console.log(afterDoc ? 'Zapis + odczyt działają na tej bazie.' : 'Nie udało się odczytać rekordu po zapisie — sprawdź nazwę bazy w punkcie 2.');
}

main()
  .catch((error) => {
    console.error('\nDiagnostyka przerwana błędem:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
