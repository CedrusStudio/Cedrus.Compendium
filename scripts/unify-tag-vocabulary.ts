/**
 * ROADMAP 9.0 — ujednolicenie słownika tagów przed wprowadzeniem facetów.
 *
 * Wspólny facet `rola` nie ma sensu, dopóki Manewry mówią `ofensywne`, a
 * Postawy, Stany, Zaklęcia i Atuty `ofensywa`. Skrypt wykonuje sześć renamów
 * przez ten sam sweep, którego używa `/api/tag-management/rename`, więc razem z
 * tagami encji ruszają:
 *   - referencje `tag` w `structuredRequirements` (wymagania licznikowe, Fala 8),
 *   - szybkie tagi w profilach personalizacji (`quickTagsByContext`).
 *
 * Sweep encji to dwie komendy Mongo na rename, nie N update'ów — przy 575
 * rekordach `ofensywne` chodzi o to, żeby częściowa awaria nie zostawiła
 * biblioteki w połowie przemianowanej.
 *
 * Dry run (domyślnie):
 *   npm run unify-tag-vocabulary
 * Zapis:
 *   npm run unify-tag-vocabulary:apply
 *
 * NAJPIERW `npm run backup-mongodb`. To jedyny nieodwracalny etap Fali 9;
 * wycofanie = te same renamy w drugą stronę (kolumna „wstecz" w raporcie).
 */

import prisma from '../src/lib/prisma';
import { renameTagEverywhere, type TagRenameClient } from '../src/persistence/tags/renameTagEverywhere';
import { tagEntityModelMap } from '../src/lib/tagEntityModels';

type Rename = { entity: string; from: string; to: string; expected: number; why: string };

/**
 * Liczby `expected` policzone na `backup/2026-08-04T06-49-21-923Z`. Rozjazd nie
 * przerywa pracy, ale jest wypisywany — znaczy, że dane ruszyły od czasu
 * planowania i warto spojrzeć, zanim się zapisze.
 */
const RENAMES: readonly Rename[] = [
  { entity: 'maneuvers', from: 'ofensywne', to: 'ofensywa', expected: 575, why: 'wspólny facet rola z Postawami/Stanami/Zaklęciami/Atutami' },
  { entity: 'maneuvers', from: 'defensywne', to: 'defensywa', expected: 240, why: 'jw.' },
  { entity: 'perks', from: 'widmowe', to: 'widmowy', expected: 13, why: 'Manewry i Postawy mówią `widmowy`' },
  { entity: 'perks', from: 'okrzyki', to: 'okrzyki-bojowe', expected: 6, why: 'Manewry mówią `okrzyki-bojowe`; wymagania licznikowe też' },
  { entity: 'perks', from: 'zwierzę', to: 'zwierzęta', expected: 3, why: 'Manewry mówią `zwierzęta`' },
  { entity: 'weapons', from: 'mistrzowski', to: 'mistrzowskie', expected: 1, why: 'Zbroje mówią `mistrzowskie` — jedna flaga jakości, nie dwie' },
];

const shouldApply = process.argv.includes('--apply');

async function main(): Promise<void>
{
  const client = prisma as unknown as TagRenameClient;

  console.log(shouldApply ? 'ZAPIS — renamy zostaną wykonane.\n' : 'DRY RUN — nic nie zostanie zapisane.\n');

  for (const rename of RENAMES)
  {
    if (!tagEntityModelMap[rename.entity])
    {
      console.error(`  POMINIĘTO: nieznana encja ${rename.entity}`);
      continue;
    }

    const report = await renameTagEverywhere(client, {
      entity: rename.entity,
      oldTag: rename.from,
      newTag: rename.to,
      dryRun: !shouldApply,
    });

    const drift = report.records === rename.expected ? '' : `  ⚠ spodziewano się ${rename.expected}`;
    console.log(`${rename.entity}: ${rename.from} → ${rename.to}`);
    console.log(`  rekordów: ${report.records}${drift}`);
    if (report.merged > 0) console.log(`  z tego scaleń (wpis miał już oba tagi): ${report.merged}`);
    if (report.requirementReferences > 0) console.log(`  referencji w wymaganiach: ${report.requirementReferences}`);
    if (report.profiles > 0) console.log(`  profili personalizacji: ${report.profiles}`);
    console.log(`  wstecz: ${rename.to} → ${rename.from}`);
    console.log(`  po co: ${rename.why}\n`);
  }

  if (shouldApply)
  {
    console.log('Zapisano. Weryfikacja: uruchom ponownie bez --apply — wszystkie liczby rekordów mają być 0.');
    return;
  }

  console.log('DRY RUN — nic nie zapisano. Żeby zapisać: npm run unify-tag-vocabulary:apply');
  console.log('Przedtem: npm run backup-mongodb');
}

main()
  .catch((error) => {
    console.error('Ujednolicenie słownika tagów nie powiodło się.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
