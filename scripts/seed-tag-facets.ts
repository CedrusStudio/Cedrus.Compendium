/**
 * ROADMAP 9.1 — wsiewa domyślny podział na facety do `TagFacet`/`TagDefinition`.
 *
 * Warstwa opisowa: nic tu nie dotyka `tags` na encjach. Puste kolekcje znaczą
 * „filtr działa jak dotąd", więc ten skrypt tylko włącza grupowanie, a jego
 * wycofanie to skasowanie dwóch kolekcji.
 *
 * Dry run (domyślnie) wypisuje tabelę tag → facet → liczba wystąpień, licząc
 * wystąpienia w BAZIE, nie w kodzie. To jest właściwy moment, żeby zobaczyć, czy
 * podział zgadza się z danymi — tag z zerem wystąpień znaczy albo literówkę w
 * seedzie, albo że rename 9.0 jeszcze nie poszedł.
 *
 * Dry run:  npm run seed-tag-facets
 * Zapis:    npm run seed-tag-facets:apply
 *
 * Zapis jest idempotentny (upsert po `key`/`tag`), więc ponowne uruchomienie
 * przywraca domyślny podział, nadpisując ręczne zmiany z panelu admina.
 */

import prisma from '../src/lib/prisma';
import { DEFAULT_TAG_DEFINITIONS, DEFAULT_TAG_FACETS } from '../src/domain/tags/defaultTagFacets';
import { spellingsForEntity } from '../src/domain/tags/tagFacets';
import { tagEntityModelMap } from '../src/lib/tagEntityModels';

const shouldApply = process.argv.includes('--apply');

/** Distinct tags actually present on each entity, straight from Mongo. */
async function loadTagsByEntity(): Promise<Map<string, Set<string>>>
{
  const byEntity = new Map<string, Set<string>>();

  for (const [entity, modelName] of Object.entries(tagEntityModelMap))
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (prisma as any)[modelName];
    const rows = await model.findMany({ select: { tags: true } }) as { tags: string[] }[];
    byEntity.set(entity, new Set(rows.flatMap(row => row.tags ?? [])));
  }

  return byEntity;
}

async function main(): Promise<void>
{
  console.log(shouldApply ? 'ZAPIS — facety zostaną wsiane.\n' : 'DRY RUN — nic nie zostanie zapisane.\n');

  const tagsByEntity = await loadTagsByEntity();
  let missing = 0;
  let orphaned = 0;

  for (const facet of DEFAULT_TAG_FACETS)
  {
    const members = DEFAULT_TAG_DEFINITIONS.filter(definition => definition.facetKey === facet.key);
    console.log(`${facet.key} — ${facet.label}  (${facet.selectionMode}, brak: ${facet.supportsNone ? 'tak' : 'nie'})`);
    console.log(`  encje: ${facet.entities.join(', ')}`);

    for (const definition of members)
    {
      const perEntity: string[] = [];
      let total = 0;

      for (const entity of facet.entities)
      {
        const available = tagsByEntity.get(entity) ?? new Set<string>();
        const present = spellingsForEntity(definition, entity).filter(spelling => available.has(spelling));
        if (present.length === 0) continue;
        perEntity.push(`${entity}:${present.join('/')}`);
        total += present.length;
      }

      if (total === 0)
      {
        missing += 1;
        console.log(`    ⚠ ${definition.tag} — nie występuje na żadnej encji tego facetu`);
        continue;
      }

      console.log(`    ${definition.tag}  ${perEntity.join('  ')}`);
    }

    console.log();
  }

  // Odwrotny kierunek: tagi w bazie, których żadna definicja nie obejmuje.
  // Nie są błędem — wpadają do kubełka „Pozostałe" i dalej da się po nich
  // szukać — ale warto je widzieć, bo to kandydaci na kolejny facet.
  const claimed = new Set<string>();
  for (const definition of DEFAULT_TAG_DEFINITIONS)
  {
    claimed.add(definition.tag);
    for (const alias of definition.aliases ?? []) claimed.add(alias.alias);
  }

  console.log('Nieprzypisane (trafią do „Pozostałe"):');
  for (const [entity, tags] of tagsByEntity)
  {
    const loose = [...tags].filter(tag => !claimed.has(tag)).sort((left, right) => left.localeCompare(right, 'pl'));
    if (loose.length === 0) continue;
    orphaned += loose.length;
    console.log(`  ${entity}: ${loose.join(', ')}`);
  }

  console.log(`\nFacetów: ${DEFAULT_TAG_FACETS.length}. Definicji: ${DEFAULT_TAG_DEFINITIONS.length}.`);
  if (missing > 0) console.log(`⚠ Definicji bez pokrycia w danych: ${missing} — sprawdź, czy rename 9.0 już poszedł.`);
  console.log(`Nieprzypisanych tagów łącznie: ${orphaned}.`);

  if (!shouldApply)
  {
    console.log('\nDRY RUN — nic nie zapisano. Żeby zapisać: npm run seed-tag-facets:apply');
    return;
  }

  for (const facet of DEFAULT_TAG_FACETS)
  {
    const data = {
      label: facet.label,
      description: facet.description ?? null,
      order: facet.order,
      selectionMode: facet.selectionMode,
      supportsNone: facet.supportsNone,
      entities: [...facet.entities],
    };

    await prisma.tagFacet.upsert({ where: { key: facet.key }, create: { key: facet.key, ...data }, update: data });
  }

  for (const definition of DEFAULT_TAG_DEFINITIONS)
  {
    const data = {
      facetKey: definition.facetKey ?? null,
      label: definition.label ?? null,
      order: definition.order ?? null,
      aliases: (definition.aliases ?? []).map(alias => ({ alias: alias.alias, entities: [...alias.entities] })),
      formerNames: [...(definition.formerNames ?? [])],
    };

    await prisma.tagDefinition.upsert({ where: { tag: definition.tag }, create: { tag: definition.tag, ...data }, update: data });
  }

  console.log(`\nZapisano ${DEFAULT_TAG_FACETS.length} facetów i ${DEFAULT_TAG_DEFINITIONS.length} definicji.`);
}

main()
  .catch((error) => {
    console.error('Wsiew facetów tagów nie powiódł się.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
