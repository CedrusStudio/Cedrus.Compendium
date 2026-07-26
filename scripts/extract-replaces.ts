/**
 * ROADMAP 8.6 — move "Zastępuje X" out of requirements into the `replaces` field.
 *
 * These texts were never requirements. "Zastępuje Młyniec" says nothing about
 * the character; it says this entity supersedes another one. Every occurrence in
 * the library points at a real Maneuver (Antyzapał, Młyniec, Zbicie Ciosu, Zapał
 * Wojownika, Zakuty W Stal, Finta), so the relation is worth keeping — just not
 * in a field that the requirement engine reads.
 *
 * Reads through `findRaw` and writes through `$runCommandRaw`, so it does NOT
 * depend on the Prisma client having been regenerated for the new column.
 *
 * Dry run (default):
 *   npm run extract-replaces
 * Apply:
 *   npm run extract-replaces:apply
 *
 * Run `npm run backup-mongodb` first.
 */

import prisma from '../src/lib/prisma';
import { readStructuredRequirements } from '../src/domain/requirements/legacyRequirementAudit';
import { replacedEntityName } from '../src/domain/characters/replaces';

type RawDelegate = {
  findRaw: (args: { filter?: Record<string, unknown>; options?: Record<string, unknown> }) => Promise<unknown>;
};

type RawDoc = { _id?: unknown; name?: unknown; structuredRequirements?: unknown; replaces?: unknown };

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

async function processCollection(label: string, collection: string, delegate: RawDelegate): Promise<number>
{
  const raw = await delegate.findRaw({
    filter: {},
    options: { projection: { name: 1, structuredRequirements: 1, replaces: 1 }, sort: { name: 1 } },
  });

  const docs = Array.isArray(raw) ? (raw as RawDoc[]) : [];
  let changed = 0;

  for (const doc of docs)
  {
    const requirements = readStructuredRequirements(doc);
    const extracted: string[] = [];

    const kept = requirements.filter((requirement) =>
    {
      if (requirement.kind !== 'rankless') return true;

      const name = replacedEntityName(requirement.text);
      if (!name) return true;

      extracted.push(name);
      return false;
    });

    if (extracted.length === 0) continue;

    changed += 1;
    const existing = Array.isArray(doc.replaces) ? (doc.replaces as string[]) : [];
    const merged = Array.from(new Set([...existing, ...extracted]
      .map((name) => name.trim())
      .filter((name) => name.length > 0)));

    console.log(`  [${label}] ${String(doc.name)} → replaces: ${merged.map((name) => `"${name}"`).join(', ')}`);

    if (shouldApply)
    {
      await prisma.$runCommandRaw({
        update: collection,
        updates: [{
          q: { _id: docId(doc) },
          u: { $set: { replaces: merged, structuredRequirements: kept } },
          multi: false,
        }],
      });
    }
  }

  console.log(`[${label}] przejrzano ${docs.length}, ${shouldApply ? 'zmieniono' : 'do zmiany'}: ${changed}.`);
  return changed;
}

async function main(): Promise<void>
{
  let total = 0;

  for (const { label, collection, delegate } of collections)
  {
    total += await processCollection(label, collection, delegate);
  }

  console.log(`\nŁącznie rekordów ${shouldApply ? 'zmienionych' : 'do zmiany'}: ${total}.`);

  if (!shouldApply)
  {
    console.log('DRY RUN — nic nie zapisano. Żeby zapisać: npm run extract-replaces:apply');
    return;
  }

  console.log('Pamiętaj o `npx prisma db push` i `npx prisma generate`, żeby klient znał pole `replaces`.');
}

main()
  .catch((error) => {
    console.error('Przenoszenie „zastępuje" nie powiodło się.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
