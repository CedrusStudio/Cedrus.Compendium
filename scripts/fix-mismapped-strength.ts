/**
 * ROADMAP 6.1, domknięcie — usuwa dwa błędne mapowania „siła", które zostały po
 * ręcznej poprawce w `/admin/requirements`.
 *
 * Historia: przed migracją w bazie siedziało 5 ręcznych wpisów z UI, w tym dwa
 * zmyślone. `Pogromienie` ma legacy tekst „Większy Fechtunek N", a dostało
 * `characteristics/strength`; `Napór Włóczniarza` ma „Zr N" (zręczność), a też
 * dostał siłę. Poprawka w panelu **dodała** właściwe wymaganie, ale błędnego nie
 * skasowała, więc oba rekordy niosą dziś jedno i drugie naraz.
 *
 * Skrypt usuwa WYŁĄCZNIE wpis `ranked characteristics/strength` i wyłącznie z
 * tych dwóch nazw. Zabezpieczenie: jeśli po usunięciu rekord zostałby bez
 * żadnego wymagania, wpis zostaje nietknięty i leci ostrzeżenie — znaczyłoby to,
 * że poprawka nigdy nie doszła i siła jest tam jedyną treścią.
 *
 * Dry run (domyślnie):
 *   npm run fix-mismapped-strength
 * Zapis:
 *   npm run fix-mismapped-strength:apply
 *
 * Najpierw `npm run backup-mongodb`.
 */

import prisma from '../src/lib/prisma';
import { readStructuredRequirements } from '../src/domain/requirements/legacyRequirementAudit';
import type { Requirement } from '../src/domain/requirements/Requirement';

type RawDelegate = {
  findRaw: (args: { filter?: Record<string, unknown>; options?: Record<string, unknown> }) => Promise<unknown>;
};

type RawDoc = { _id?: unknown; name?: unknown; grade?: unknown; structuredRequirements?: unknown };

/** Nazwy, w których „siła" jest pomyłką, wraz z tym, co naprawdę mają wymagać. */
const TARGETS: ReadonlyArray<{ name: string; correct: string }> = [
  { name: 'Pogromienie', correct: 'Większy Fechtunek (atut)' },
  { name: 'Napór Włóczniarza', correct: 'zręczność' },
];

const shouldApply = process.argv.includes('--apply');

function docId(doc: RawDoc): string
{
  const id = doc._id;
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && '$oid' in id) return String((id as { $oid: unknown }).$oid);
  return String(id ?? '');
}

/** Ten i tylko ten wpis jest do usunięcia. */
function isMismappedStrength(requirement: Requirement): boolean
{
  return requirement.kind === 'ranked'
    && requirement.group === 'characteristics'
    && requirement.targetKey === 'strength';
}

function describe(requirement: Requirement): string
{
  return requirement.kind === 'ranked'
    ? `${requirement.group}/${requirement.targetKey} ≥ ${requirement.value}`
    : requirement.kind;
}

async function main(): Promise<void>
{
  const delegate = prisma.maneuver as unknown as RawDelegate;

  const raw = await delegate.findRaw({
    filter: { name: { $in: TARGETS.map((target) => target.name) } },
    options: { projection: { name: 1, grade: 1, structuredRequirements: 1 }, sort: { name: 1, grade: 1 } },
  });

  const docs = Array.isArray(raw) ? (raw as RawDoc[]) : [];

  if (docs.length === 0)
  {
    console.log('Nie znaleziono żadnego z manewrów — nic do roboty.');
    return;
  }

  let changed = 0;
  let skipped = 0;

  for (const doc of docs)
  {
    const requirements = readStructuredRequirements(doc);
    const kept = requirements.filter((requirement) => !isMismappedStrength(requirement));
    const removed = requirements.filter(isMismappedStrength);

    const label = `${String(doc.name)} r${String(doc.grade)}`;

    if (removed.length === 0)
    {
      console.log(`  [ok]   ${label} — brak błędnej siły, pomijam.`);
      continue;
    }

    if (kept.length === 0)
    {
      skipped += 1;
      console.warn(`  [UWAGA] ${label} — siła jest JEDYNYM wymaganiem. Nie ruszam: poprawne wymaganie (${TARGETS.find((t) => t.name === doc.name)?.correct}) najwyraźniej nigdy nie zostało dodane. Dodaj je w /admin/requirements i uruchom skrypt ponownie.`);
      continue;
    }

    changed += 1;
    console.log(`  [fix]  ${label} — usuwam ${removed.map(describe).join(', ')}; zostaje: ${kept.map(describe).join(', ')}`);

    if (shouldApply)
    {
      await prisma.$runCommandRaw({
        update: 'maneuvers',
        updates: [{ q: { _id: docId(doc) }, u: { $set: { structuredRequirements: kept } }, multi: false }],
      });
    }
  }

  console.log(`\nRekordów ${shouldApply ? 'poprawionych' : 'do poprawy'}: ${changed}. Pominiętych z ostrzeżeniem: ${skipped}.`);

  if (!shouldApply)
  {
    console.log('DRY RUN — nic nie zapisano. Żeby zapisać: npm run fix-mismapped-strength:apply');
  }
}

main()
  .catch((error) => {
    console.error('Czyszczenie błędnych wymagań siły nie powiodło się.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
