/**
 * Throwaway verification harness for the printable character sheet.
 *
 * Rebuilds `CharacterWithRelations` from a `backup/` dump, runs it through the
 * real mapping and `buildSheetModel`, and prints what the sheet would contain
 * plus a rough page budget. Exists because the sheet's page budget is a claim
 * about real data, not about types — see the print plan §2.3.
 *
 * Usage:
 *   npm run verify-sheet-model                 największa i typowa postać
 *   npm run verify-sheet-model --all           sweep po wszystkich postaciach
 *   npm run verify-sheet-model Saofie          konkretna postać
 *   npm run verify-sheet-model --html Saofie   podgląd wydruku do pliku HTML
 */

import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterSheet from '@/application/characters/sheet/CharacterSheet';
import { toCharacter, CharacterWithRelations } from '@/persistence/mappings/characterMapping';
import { buildSheetModel, SheetStatLine } from '@/domain/characters/sheet/sheetModel';
import { summarizeDescription } from '@/domain/characters/sheet/summarizeDescription';
import { parseSheetOptions, toSheetQuery, defaultSheetOptions } from '@/domain/characters/sheet/sheetOptions';
import { ownPageThreshold } from '@/application/characters/sheet/primitives/needsOwnPage';
import { applyActiveBuffProfile } from '@/domain/characters/buffs/applyBuffProfile';

type Row = Record<string, unknown> & { id: string };

const backupDirectory = latestBackup();
const collections = loadCollections(backupDirectory);

console.log(`backup: ${path.basename(backupDirectory)}\n`);

verifySummaries();
verifyOptions();

const nameFragment = process.argv[2];
const characters = (collections['Character'] ?? []) as Row[];

if (nameFragment === '--all')
{
  sweepAllCharacters(characters);
}
else if (nameFragment === '--html')
{
  writeHtmlPreview(process.argv[3]);
}
else
{
  const targets = nameFragment
    ? characters.filter(row => String(row['name']).toLowerCase().includes(nameFragment.toLowerCase()))
    : [biggestCharacter(characters), typicalCharacter(characters)].filter(Boolean) as Row[];

  for (const row of targets) reportCharacter(row);
}

/**
 * Standalone HTML preview of the printed sheet — the real components and the
 * real stylesheet, no dev server. Open it and press Ctrl+P to see exactly what
 * comes out of the printer.
 */
function writeHtmlPreview(fragment: string | undefined): void
{
  const row = fragment
    ? characters.find(candidate => String(candidate['name']).toLowerCase().includes(fragment.toLowerCase()))
    : biggestCharacter(characters);

  if (!row)
  {
    console.log(`nie znaleziono postaci: ${fragment}`);
    return;
  }

  const model = modelFor(row, new Date());
  const css = fs.readFileSync(path.resolve('src/app/(print)/sheet.css'), 'utf8');
  const body = renderToStaticMarkup(
    React.createElement(CharacterSheet, { model, options: { ...defaultSheetOptions, appendix: true } }),
  );

  const output = path.resolve(`karta-${model.header.shortName.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.html`);

  fs.writeFileSync(output, `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>Karta postaci — ${model.header.name}</title>
<style>
body { margin: 0; padding: 12px; background: #f4f4f4; font-family: system-ui, sans-serif; }
.snapshot-warning { max-width: 192mm; margin: 0 auto 6mm; padding: 8px 12px; border: 1px solid #c96; background: #fff8ec; font-size: 13px; line-height: 1.4; }
@media print { body { padding: 0; background: #fff; } }
${css}
</style>
</head>
<body>
<div class="snapshot-warning screen-only">
  <strong>Podgląd ze zrzutu bazy <code>${path.basename(backupDirectory)}</code>, nie z żywej bazy.</strong>
  Wszystko, co zmieniłeś w aplikacji po tym zrzucie — w szczególności włączone i wyłączone wzmocnienia — nie jest tu widoczne.
  Aktualny stan: <code>npm run dev</code> → <code>/characters/${model.header.name ? '&lt;id&gt;' : ''}/sheet</code>.
  Świeży zrzut: <code>npm run backup-mongodb</code>.
</div>
${body}
</body>
</html>
`, 'utf8');

  console.log(`podgląd zapisany: ${output}`);
}

/** Every character in the dump against the two-page budget for the main sheet. */
function sweepAllCharacters(rows: Row[]): void
{
  const distribution = new Map<number, number>();
  const violations: string[] = [];

  for (const row of rows)
  {
    const model = modelFor(row, new Date('2026-08-04T12:00:00Z'));
    const spellCount = model.powers.reduce((count, power) => count + power.spells.length, 0);
    const talentCount = model.talents.reduce((count, group) => count + group.talents.length, 0);
    const report = estimatePages(model, spellCount, talentCount);
    const mainPages = Number(/karta (\d+)/.exec(report)?.[1] ?? 0);

    distribution.set(mainPages, (distribution.get(mainPages) ?? 0) + 1);
    if (mainPages > 2) violations.push(`${row['name']} — ${report.split('\n')[1]}`);
  }

  console.log(`postaci: ${rows.length}`);
  for (const [pages, count] of [...distribution.entries()].sort()) console.log(`  karta na ${pages} str.: ${count}`);
  console.log(violations.length === 0 ? '\nok   budżet 2 stron dotrzymany dla wszystkich postaci' : `\nFAIL ${violations.length} przekroczeń:`);
  for (const violation of violations.slice(0, 10)) console.log(`  ${violation}`);
}

// --------------------------------------------------------------------------

function latestBackup(): string
{
  const root = path.resolve('backup');
  const directories = fs.readdirSync(root).filter(entry => fs.statSync(path.join(root, entry)).isDirectory()).sort();
  return path.join(root, directories[directories.length - 1]);
}

function loadCollections(directory: string): Record<string, Row[]>
{
  const collections: Record<string, Row[]> = {};

  for (const file of fs.readdirSync(directory))
  {
    if (!file.endsWith('.json') || file === '_manifest.json') continue;
    collections[file.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  }

  return collections;
}

function byIds(collection: string, ids: unknown): Row[]
{
  const wanted = new Set((Array.isArray(ids) ? ids : []) as string[]);
  return (collections[collection] ?? []).filter(row => wanted.has(row.id));
}

function assemble(row: Row): CharacterWithRelations
{
  const powers = (row['powers'] ?? []) as { spellsIds?: string[] }[];
  const spellIds = powers.flatMap(power => power.spellsIds ?? []);

  return {
    ...row,
    apiKeys: row['apiKeys'] ?? [],
    race: (collections['Race'] ?? []).find(race => race.id === row['raceId']) ?? null,
    stances: byIds('Stance', row['stancesIds']),
    states: byIds('State', row['statesIds']),
    maneuvers: byIds('Maneuver', row['maneuversIds']),
    spells: byIds('Spell', spellIds),
    perks: byIds('Perk', row['perksIds']),
    weapons: byIds('Weapon', row['weaponsIds']),
    armors: byIds('Armor', row['armorsIds']),
    shields: byIds('Shield', row['shieldsIds']),
    inventory: byIds('InventoryItem', row['inventoryIds']),
    mounts: byIds('Mount', row['mountsIds']),
    powerSpecifications: byIds('PowerSpecification', row['powerSpecificationsIds']),
  } as unknown as CharacterWithRelations;
}

/**
 * Single entry point for all three modes, so a report, a sweep and an HTML
 * preview of the same character can never disagree. `applyActiveBuffProfile`
 * mirrors what `CharacterSheetView` does — without it the script would report
 * base values while the printed sheet shows buffed ones.
 */
function modelFor(row: Row, generatedOn: Date)
{
  return buildSheetModel(applyActiveBuffProfile(toCharacter(assemble(row))), { generatedOn });
}

function reportCharacter(row: Row): void
{
  const model = modelFor(row, new Date('2026-08-04T12:00:00Z'));

  const spellCount = model.powers.reduce((count, power) => count + power.spells.length, 0);
  const talentCount = model.talents.reduce((count, group) => count + group.talents.length, 0);

  console.log('='.repeat(78));
  console.log(`${model.header.name}  [${model.header.shortName}]  ${model.header.generatedOn}`);
  console.log('='.repeat(78));
  console.log(`cechy      ${model.characteristics.map(formatStat).join('  ')}`);
  console.log(`atrybuty   ${model.attributes.map(formatStat).join('  ')}`);
  console.log(`zdrowie    ${model.vitals.totalHealth}  (PL ${model.vitals.recoveryLevel}, ${model.vitals.rows.map(row => `${row.label} ${row.value}`).join(', ')})`);

  for (const defense of model.defenses)
  {
    console.log(`obrona     ${defense.isDefault ? '▸' : ' '} ${defense.name.padEnd(22)} pełna ${defense.fullReduction}  blok ${defense.blockReduction}  bezp. ${defense.directReduction}`);
  }

  for (const offense of model.offenses)
  {
    console.log(`atak       ${offense.isDefault ? '▸' : ' '} ${offense.name.padEnd(22)} ${offense.leading} kryt ${offense.leadingCritical}  obr. ${offense.damage}${offense.additionalDamage ? ` +${offense.additionalDamage}` : ''}`);
  }

  for (const weapon of model.equipment.weapons)
  {
    console.log(`broń       ${weapon.name.padEnd(24)} ${weapon.style} · zasięg ${weapon.range} · atak ${weapon.attack} · kryt ${weapon.critical} · obr. ${weapon.damage}`);
  }

  for (const armor of model.equipment.armors)
  {
    console.log(`pancerz    ${armor.name.padEnd(24)} red. ${armor.protection} · niewr. ${armor.immunity} · odp. ${armor.resistance} · ogr. ${armor.dexterityRestriction}/${armor.reflexRestriction}/${armor.initiativeRestriction} · kara ${armor.attributePenalty}`);
  }

  for (const shield of model.equipment.shields)
  {
    console.log(`tarcza     ${shield.name.padEnd(24)} blok ${shield.block} · odp. ${shield.resistance} · ogr. ${shield.dexterityRestriction}/${shield.reflexRestriction}/${shield.initiativeRestriction} · kara ${shield.attributePenalty}`);
  }

  console.log(`\nmanewry ${model.maneuvers.length} · postawy ${model.stances.length} · stany ${model.states.length} · atuty ${model.perks.length} · moce ${model.powers.length} · zaklęcia ${spellCount} · umiejętności ${talentCount} · wzmocnienia ${model.buffs.length}`);

  for (const maneuver of model.maneuvers.slice(0, 4))
  {
    console.log(`  manewr   ${maneuver.name.padEnd(26)} rg${maneuver.grade} ${String(maneuver.castTime).padEnd(18)} ${maneuver.summary}`);
  }

  for (const power of model.powers)
  {
    console.log(`  moc      ${power.name} (${power.type}, poz. ${power.level}, esencja ${power.essence}) — zaklęć ${power.spells.length}`);
    for (const spell of power.spells.slice(0, 3))
    {
      console.log(`    zaklęcie ${spell.name.padEnd(24)} rg${spell.grade} koszt ${String(spell.cost).padEnd(10)} ${spell.summary}`);
    }
  }

  for (const buff of model.buffs) console.log(`  buff     ${buff.name} (${buff.source}): ${buff.changes.join(' · ')}`);

  console.log(`\n${estimatePages(model, spellCount, talentCount)}\n`);
}

/**
 * Rough page budget: counts printed rows and divides by how many fit on A4 at
 * 8.5pt. Not a substitute for looking at the print preview — a sanity check that
 * the compact sheet is in the right order of magnitude.
 */
function estimatePages(model: ReturnType<typeof buildSheetModel>, spellCount: number, talentCount: number): string
{
  const rowsPerPage = 62;

  const descriptionLines = (model.header.description ?? '')
    .split(/\r?\n/)
    .reduce((lines, line) => lines + Math.max(1, Math.ceil(line.length / 150)), 0);
  const headerRows = 3 + (model.header.descriptionIsLong ? Math.ceil(descriptionLines / 2) : descriptionLines);
  // Cechy (6) and atrybuty (9) print side by side, each as a table with a
  // header row — the taller block sets the height.
  const statsRows = 9 + 2;
  const vitalsRows = 4;
  const combatRows = model.defenses.length + model.offenses.length + 4;
  // Inventory prints in two columns; the rest as tables.
  const equipmentRows = model.equipment.weapons.length
    + model.equipment.armors.length
    + model.equipment.shields.length
    + model.equipment.mounts.length
    + Math.ceil(model.equipment.inventory.length / 2)
    + 4;
  // Postawy and stany print side by side, atuty in two columns — both cost the
  // taller half, not the sum.
  const actionRows = model.maneuvers.length + Math.max(model.stances.length, model.states.length) + 6;
  const perkRows = Math.ceil(model.perks.length / 2) + 2;
  const buffRows = model.buffs.length + 2;
  const notesRows = 8;

  // Mirrors `needsOwnPage`: small reference blocks stay inline instead of
  // claiming a page each.
  const itemCount = Object.values(model.equipment).reduce((count, items) => count + items.length, 0);
  const powerEntryCount = model.powers.reduce((count, power) => count + power.spells.length + 3, 0);

  const equipmentBreaks = itemCount > ownPageThreshold;
  const powersBreak = powerEntryCount > ownPageThreshold;
  const talentsBreak = talentCount > ownPageThreshold;

  const powerRows = spellCount + model.powers.length * 4;
  const talentRows = Math.ceil(talentCount / 3);

  const mainRows = headerRows + statsRows + vitalsRows + combatRows + actionRows + perkRows + buffRows + notesRows
    + (equipmentBreaks ? 0 : equipmentRows)
    + (powersBreak || model.powers.length === 0 ? 0 : powerRows)
    + (talentsBreak || talentCount === 0 ? 0 : talentRows);

  const mainPages = Math.ceil(mainRows / rowsPerPage);
  const equipmentPages = equipmentBreaks ? Math.ceil(equipmentRows / rowsPerPage) : 0;
  const powerPages = powersBreak ? Math.ceil(powerRows / rowsPerPage) : 0;
  const talentPages = talentsBreak ? Math.ceil(talentRows / rowsPerPage) : 0;

  const verdict = mainPages <= 2 ? 'OK' : 'PRZEKROCZONY BUDŻET';

  const breakdown = `nagłówek ${headerRows} · statystyki ${statsRows} · zdrowie ${vitalsRows} · walka ${combatRows} · akcje ${actionRows} · atuty ${perkRows} · wzmocnienia ${buffRows} · notatki ${notesRows} = ${mainRows} wierszy`;

  return `${breakdown}\nbudżet stron: karta ${mainPages} (${verdict}, limit 2) · ekwipunek ${equipmentPages} · moce ${powerPages} · umiejętności ${talentPages} · razem ${mainPages + equipmentPages + powerPages + talentPages}`;
}

function formatStat(stat: SheetStatLine): string
{
  const modifiers = [stat.bonus, stat.testBonus]
    .filter(modifier => modifier !== 0)
    .map(modifier => `${modifier > 0 ? '+' : ''}${modifier}`)
    .join('');

  return `${stat.abbr} ${stat.dice}+${stat.value}${modifiers}=${stat.total}`;
}

function biggestCharacter(rows: Row[]): Row
{
  return [...rows].sort((left, right) => JSON.stringify(right).length - JSON.stringify(left).length)[0];
}

function typicalCharacter(rows: Row[]): Row
{
  const sorted = [...rows].sort((left, right) => JSON.stringify(left).length - JSON.stringify(right).length);
  return sorted[Math.floor(sorted.length * 0.9)];
}

function verifySummaries(): void
{
  const cases: [input: string, expected: string][] =
  [
    ['Pierwsze zdanie opisu. Drugie zdanie, którego nie chcemy.', 'Pierwsze zdanie opisu.'],
    ['Krótki opis bez kropki', 'Krótki opis bez kropki'],
    ['\n\n  Akapit po pustych liniach. Reszta.\nDrugi akapit.', 'Akapit po pustych liniach.'],
    ['Działa np. wtedy, gdy przeciwnik jest zaskoczony. Inaczej nie.', 'Działa np. wtedy, gdy przeciwnik jest zaskoczony.'],
    ['', ''],
  ];

  for (const [input, expected] of cases)
  {
    const actual = summarizeDescription(input);
    console.log(`${actual === expected ? 'ok  ' : 'FAIL'} summarize: ${JSON.stringify(actual)}${actual === expected ? '' : ` !== ${JSON.stringify(expected)}`}`);
  }

  const long = 'a'.repeat(200);
  const truncated = summarizeDescription(long, 30);
  console.log(`${truncated.length <= 31 && truncated.endsWith('…') ? 'ok  ' : 'FAIL'} summarize: obcięcie długiego tekstu -> ${truncated.length} znaków`);
}

function verifyOptions(): void
{
  const all = parseSheetOptions(undefined);
  const some = parseSheetOptions({ sections: 'talents,stats,nieznana', appendix: '1' });
  const garbage = parseSheetOptions({ sections: 'zupełnie-nieznana' });

  console.log(`${all.sections.length === defaultSheetOptions.sections.length && !all.appendix ? 'ok  ' : 'FAIL'} options: brak parametrów -> wszystkie sekcje`);
  console.log(`${some.sections.join(',') === 'stats,talents' && some.appendix ? 'ok  ' : 'FAIL'} options: '${some.sections.join(',')}' appendix=${some.appendix}`);
  console.log(`${garbage.sections.length === defaultSheetOptions.sections.length ? 'ok  ' : 'FAIL'} options: same śmieci -> fallback na wszystko`);
  console.log(`${parseSheetOptions({ sections: '' }).sections.length === 0 ? 'ok  ' : 'FAIL'} options: jawnie pusta lista -> zero sekcji`);
  console.log(`${toSheetQuery(defaultSheetOptions) === '' ? 'ok  ' : 'FAIL'} options: domyślne -> pusty query`);
  console.log(`${toSheetQuery({ sections: ['talents', 'stats'], appendix: true }) === '?sections=stats%2Ctalents&appendix=1' ? 'ok  ' : 'FAIL'} options: query = ${toSheetQuery({ sections: ['talents', 'stats'], appendix: true })}`);
  console.log('');
}
