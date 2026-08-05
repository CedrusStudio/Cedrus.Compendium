/**
 * Writes everything a model needs to draft a character into `ai-workspace/`,
 * so the work can happen outside the application.
 *
 * The point of the offline route is the catalog: the hosted path has to squeeze
 * the compendium into a 120 000 character prompt and therefore filters by
 * relevance down to roughly 310 of 2528 entries, while this dump is complete
 * and lets a long-context model decide for itself what matters.
 *
 * It writes the rules and the balance profiles too, so an offline draft answers
 * the same brief as a hosted one rather than a shorter version of it.
 *
 * Usage:
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/dump-ai-character-context.ts
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/dump-ai-character-context.ts --from-backup=backup/2026-08-03T10-00-00
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/dump-ai-character-context.ts --out=ai-workspace
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  toAiCharacterCatalog,
  AI_CATALOG_KINDS,
  type AiCatalogKind,
  type RawCatalog,
  type RawCatalogRecord,
} from '../src/domain/ai-character-generation/toAiCharacterCatalog';
import { aiCharacterProposalStrictJsonSchema } from '../src/infrastructure/ai-character-generation/openAiCharacterProposalResponseFormat';
import type { CharacterGenerationCatalogEntry } from '../src/domain/ai-character-generation/CharacterGenerationProvider';
import { renderCharacterGenerationInstructions } from '../src/domain/ai-character-generation/characterGenerationInstructions';
import { buildBalanceProfiles, type BalanceSourceCharacter } from '../src/domain/ai-character-generation/buildBalanceProfiles';
import { POWER_SCALES } from '../src/domain/ai-character-generation/powerTiers';

/** Prisma model names, in the order `AI_CATALOG_KINDS` expects them. */
const MODEL_BY_KIND: Record<AiCatalogKind, string> = {
  race: 'Race',
  perk: 'Perk',
  maneuver: 'Maneuver',
  stance: 'Stance',
  state: 'State',
  spell: 'Spell',
  powerSpecification: 'PowerSpecification',
  weapon: 'Weapon',
  armor: 'Armor',
  shield: 'Shield',
  inventoryItem: 'InventoryItem',
  mount: 'Mount',
};

function readArgument(name: string): string | undefined
{
  const prefix = `--${name}=`;
  const argument = process.argv.slice(2).find(value => value.startsWith(prefix));
  return argument?.slice(prefix.length);
}

/**
 * `backup-mongodb.ts` writes one file per Prisma model. Reading the dump keeps
 * this usable without a live database — the case where the compendium is only
 * available as a restored snapshot.
 */
function readCatalogFromBackup(backupDirectory: string): RawCatalog
{
  const raw: RawCatalog = {};

  for (const kind of AI_CATALOG_KINDS) {
    const file = path.join(backupDirectory, `${MODEL_BY_KIND[kind]}.json`);
    if (!fs.existsSync(file)) {
      console.warn(`  ${kind}: brak pliku ${path.basename(file)}, pomijam`);
      continue;
    }

    const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
    raw[kind] = Array.isArray(parsed) ? parsed as RawCatalogRecord[] : [];
  }

  return raw;
}

async function readCatalogFromDatabase(): Promise<RawCatalog>
{
  // Imported lazily so the backup route never opens a database connection.
  const { default: prisma } = await import('../src/lib/prisma');
  const delegates = prisma as unknown as Record<string, { findMany: () => Promise<RawCatalogRecord[]> }>;

  const raw: RawCatalog = {};
  for (const kind of AI_CATALOG_KINDS) {
    raw[kind] = await delegates[kind].findMany();
  }

  await prisma.$disconnect();
  return raw;
}

/**
 * Balance profiles are computed from the characters, not the compendium, so
 * they come from a second source. Without them an offline draft has no idea
 * what „wyróżniający" means in numbers — which is the whole reason the hosted
 * path sends them.
 */
function readCharactersFromBackup(backupDirectory: string): BalanceSourceCharacter[]
{
  const file = path.join(backupDirectory, 'Character.json');
  if (!fs.existsSync(file)) return [];

  const parsed: unknown = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(parsed) ? parsed as BalanceSourceCharacter[] : [];
}

async function readCharactersFromDatabase(): Promise<BalanceSourceCharacter[]>
{
  const { default: prisma } = await import('../src/lib/prisma');
  return await prisma.character.findMany() as unknown as BalanceSourceCharacter[];
}

function readRulebook(): string | null
{
  try {
    const file = path.join(process.cwd(), 'public', 'data', 'rulebook', 'rulebook-complete.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      sections?: {
        title?: string;
        content?: unknown[];
        subsections?: { title?: string; content?: unknown[] }[];
      }[];
    };

    // Most sections keep their substance one level down — the advancement cost
    // tables among them — so the subsections have to be walked as well.
    const renderBlocks = (blocks: readonly unknown[] = []): string => blocks
      .map(block => {
        const typed = block as { type?: string; content?: string; items?: string[]; table?: { headers: string[]; rows: string[][] } };
        if (typed.type === 'paragraph' || typed.type === 'heading' || typed.type === 'blockquote') return typed.content ?? '';
        if (typed.type === 'list') return (typed.items ?? []).join('\n');
        if (typed.type === 'table' && typed.table) {
          return [typed.table.headers.join(' | '), ...typed.table.rows.map(row => row.join(' | '))].join('\n');
        }
        return '';
      })
      .filter(text => text.length > 0)
      .join('\n\n');

    const sections = (data.sections ?? []).map(section => {
      const body = [
        renderBlocks(section.content),
        ...(section.subsections ?? []).map(subsection => {
          const rendered = renderBlocks(subsection.content);
          return rendered.length > 0 ? `### ${subsection.title ?? 'bez tytułu'}\n\n${rendered}` : '';
        }),
      ]
        .filter(text => text.length > 0)
        .join('\n\n');

      return `## ${section.title ?? 'bez tytułu'}\n\n${body}`;
    });

    return sections.length > 0 ? `# Podręcznik\n\n${sections.join('\n\n')}\n` : null;
  } catch {
    // The rulebook is generated by `sync-rulebook` and may not exist yet.
    return null;
  }
}

function summarise(entries: readonly CharacterGenerationCatalogEntry[]): void
{
  const counts = new Map<string, number>();
  for (const entry of entries) counts.set(entry.kind, (counts.get(entry.kind) ?? 0) + 1);

  for (const kind of AI_CATALOG_KINDS) {
    console.log(`  ${kind.padEnd(20)} ${counts.get(kind) ?? 0}`);
  }
}

async function main(): Promise<void>
{
  const outputRoot = path.resolve(process.cwd(), readArgument('out') ?? 'ai-workspace');
  const backupDirectory = readArgument('from-backup');
  const contextDirectory = path.join(outputRoot, 'context');

  fs.mkdirSync(contextDirectory, { recursive: true });
  fs.mkdirSync(path.join(outputRoot, 'drafts'), { recursive: true });
  fs.mkdirSync(path.join(outputRoot, 'requests'), { recursive: true });

  console.log(backupDirectory
    ? `Czytam kompendium z kopii: ${backupDirectory}`
    : 'Czytam kompendium z bazy danych');

  const raw = backupDirectory
    ? readCatalogFromBackup(path.resolve(process.cwd(), backupDirectory))
    : await readCatalogFromDatabase();

  const catalog = toAiCharacterCatalog(raw);
  fs.writeFileSync(path.join(contextDirectory, 'catalog.json'), JSON.stringify(catalog, null, 2));

  fs.writeFileSync(
    path.join(contextDirectory, 'proposal.schema.json'),
    JSON.stringify(aiCharacterProposalStrictJsonSchema, null, 2),
  );

  // The rules the hosted model is given. Without them an offline draft answers
  // a different brief and fails review for reasons nobody can see — every one
  // of those lines is a repair for something a real draft got wrong.
  fs.writeFileSync(
    path.join(contextDirectory, 'instructions.md'),
    renderCharacterGenerationInstructions(),
  );

  fs.writeFileSync(
    path.join(contextDirectory, 'power-scales.json'),
    JSON.stringify(POWER_SCALES, null, 2),
  );

  const characters = backupDirectory
    ? readCharactersFromBackup(path.resolve(process.cwd(), backupDirectory))
    : await readCharactersFromDatabase();
  const balanceProfiles = buildBalanceProfiles(characters);
  fs.writeFileSync(
    path.join(contextDirectory, 'balance-profiles.json'),
    JSON.stringify(balanceProfiles, null, 2),
  );

  const rulebook = readRulebook();
  if (rulebook) {
    fs.writeFileSync(path.join(contextDirectory, 'rulebook.md'), rulebook);
  } else {
    console.warn('Podręcznik niedostępny (uruchom `sync-rulebook`), pomijam rulebook.md');
  }

  console.log('');
  console.log(`Zapisano do ${contextDirectory}`);
  summarise(catalog);
  console.log('');
  console.log(`Razem ${catalog.length} wpisów, ${JSON.stringify(catalog).length} znaków.`);
  console.log(`Profile balansu: ${balanceProfiles.length} (z ${characters.length} postaci).`);
  console.log(`Skale mocy: ${POWER_SCALES.length} rodziny.`);
  console.log(`Gotowy draft połóż w ${path.join(outputRoot, 'drafts')} i wygeneruj postać z providerem "local".`);
}

main().catch(error => {
  console.error('Zrzut kontekstu nie powiódł się.', error);
  process.exitCode = 1;
});
