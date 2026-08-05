/**
 * Reports what the compendium actually looks like, so „czy balans działa" stops
 * being a question answered by eyeballing one draft at a time.
 *
 * Three things it answers that nothing else does:
 *  - which tags are measurable, and which sit just under the threshold and are
 *    therefore invisible to AI generation;
 *  - where the curated POWER_TIERS disagree with the measured distribution;
 *  - which characters drag a profile around, because a handful of unfinished
 *    records move a median more than anything the model does.
 *
 * Usage:
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/audit-balance.ts
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/audit-balance.ts --from-backup=backup/<stamp>
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/audit-balance.ts --tag=wojak
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  buildBalanceProfiles,
  type BalanceProfile,
  type BalanceSourceCharacter,
} from '../src/domain/ai-character-generation/buildBalanceProfiles';
import { POWER_TIERS } from '../src/domain/ai-character-generation/powerTiers';
import { findTierDrift } from '../src/domain/ai-character-generation/compareToBalanceProfile';

/** Mirrors `MIN_CHARACTERS_PER_TAG`; tags below it never become a profile. */
const PROFILE_THRESHOLD = 8;

function readArgument(name: string): string | undefined
{
  const prefix = `--${name}=`;
  return process.argv.slice(2).find(value => value.startsWith(prefix))?.slice(prefix.length);
}

async function readCharacters(): Promise<BalanceSourceCharacter[]>
{
  const backup = readArgument('from-backup');

  if (backup) {
    const file = path.resolve(process.cwd(), backup, 'Character.json');
    return JSON.parse(fs.readFileSync(file, 'utf8')) as BalanceSourceCharacter[];
  }

  const { default: prisma } = await import('../src/lib/prisma');
  const characters = await prisma.character.findMany({
    select: { tags: true, characteristics: true, attributes: true, maneuversIds: true, perksIds: true },
  });
  await prisma.$disconnect();

  return characters as unknown as BalanceSourceCharacter[];
}

function renderProfile(profile: BalanceProfile): string[]
{
  const lines = [
    ``,
    `## ${profile.tag} (${profile.characters} postaci)`,
    ``,
    `| cecha | mediana | p90 | max |`,
    `| --- | ---: | ---: | ---: |`,
    ...profile.attributes.map(a => `| ${a.name} | ${a.median} | ${a.high} | ${a.max} |`),
    ``,
    `Najwyższy atrybut: mediana ${profile.speciality.median}, p90 ${profile.speciality.high}, max ${profile.speciality.max}.`,
    `Manewrów: mediana ${profile.maneuvers.median}, p90 ${profile.maneuvers.high}. `
      + `Atutów: mediana ${profile.perks.median}, p90 ${profile.perks.high}.`,
  ];

  const drift = findTierDrift(POWER_TIERS, profile);
  if (drift.length > 0) {
    lines.push(``, `**Rozjazd tabeli poziomów z pomiarem:**`);
    for (const entry of drift) {
      lines.push(`- \`${entry.tier}\`.${entry.field} = ${entry.intended}; `
        + `pomiar: mediana ${entry.measuredMedian}, p90 ${entry.measuredHigh}. ${entry.note}`);
    }
  }

  return lines;
}

/** Tags too rare to profile, and therefore invisible to generation. */
function renderNearMisses(characters: readonly BalanceSourceCharacter[]): string[]
{
  const counts = new Map<string, number>();
  for (const character of characters) {
    for (const tag of character.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }

  const near = [...counts.entries()]
    .filter(([, count]) => count > 1 && count < PROFILE_THRESHOLD)
    .sort((left, right) => right[1] - left[1]);

  if (near.length === 0) return [];

  return [
    ``,
    `## Tagi pod progiem (${PROFILE_THRESHOLD} postaci)`,
    ``,
    `Te tagi nie dostają profilu, więc opis, który je nazywa, nie dostaje skali.`,
    ``,
    ...near.map(([tag, count]) => `- ${tag}: ${count}`),
  ];
}

async function main(): Promise<void>
{
  const characters = await readCharacters();
  const profiles = buildBalanceProfiles(characters);
  const only = readArgument('tag');
  const shown = only ? profiles.filter(profile => profile.tag === only) : profiles;

  const lines = [
    `# Audyt balansu kompendium`,
    ``,
    `Postaci: ${characters.length}. Profili powyżej progu: ${profiles.length}.`,
    ...shown.flatMap(renderProfile),
    ...renderNearMisses(characters),
  ];

  const outputRoot = path.resolve(process.cwd(), 'ai-workspace', 'reports');
  fs.mkdirSync(outputRoot, { recursive: true });
  const file = path.join(outputRoot, 'balance.md');
  fs.writeFileSync(file, lines.join('\n') + '\n');

  console.log(lines.join('\n'));
  console.log(``);
  console.log(`Zapisano ${file}`);
}

main().catch(error => {
  console.error('Audyt balansu nie powiódł się.', error);
  process.exitCode = 1;
});
