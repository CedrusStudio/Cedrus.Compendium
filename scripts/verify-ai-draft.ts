/**
 * Reviews a hand-prepared draft the way the server will, before it is loaded.
 *
 * The offline route's one real advantage over the hosted one is that it can
 * check its own work: the hosted model answers once, blind, while a draft
 * sitting in `ai-workspace/drafts/` can be run through the very same validators
 * and rewritten until they are quiet. That is the whole difference between a
 * draft that arrives with seven unmet requirements and one that arrives clean.
 *
 * Every check here is the production code path, imported rather than
 * reimplemented, so a rule that changes in the application changes here too.
 *
 * Usage:
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/verify-ai-draft.ts
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/verify-ai-draft.ts --workspace=ai-workspace
 *   node --import ./scripts/ts-alias-hooks.mjs scripts/verify-ai-draft.ts --from-backup=backup/<znacznik>
 *
 * Exit code is 1 when the draft would not load at all, 0 otherwise — review
 * notes are reported, never fatal, exactly as they are in the application.
 */

import fs from 'node:fs';
import path from 'node:path';
import { stripWireNulls } from '../src/infrastructure/ai-character-generation/openAiCharacterProposalResponseFormat';
import {
  buildCatalogIdentityIndex,
  normalizeAiProposalIdentifiers,
} from '../src/domain/ai-character-generation/normalizeAiProposalIdentifiers';
import { aiCharacterProposalSchema } from '../src/domain/ai-character-generation/aiCharacterProposalSchema';
import {
  getAiCharacterGenerationAllowedReferences,
  validateAiCharacterProposalForAcceptance,
} from '../src/domain/ai-character-generation/validateAiCharacterProposalForAcceptance';
import { validateAiCharacterProposalRequirements } from '../src/domain/ai-character-generation/validateAiCharacterProposalRequirements';
import { reviewAiCharacterProposalCombat } from '../src/domain/ai-character-generation/reviewAiCharacterProposalCombat';
import { compareToBalanceProfile } from '../src/domain/ai-character-generation/compareToBalanceProfile';
import { readStructuredRequirements } from '../src/domain/requirements/legacyRequirementAudit';
import type { Requirement } from '../src/domain/requirements/Requirement';
import type { CharacterGenerationContext } from '../src/domain/ai-character-generation/CharacterGenerationProvider';

function readArgument(name: string): string | undefined
{
  const prefix = `--${name}=`;
  return process.argv.slice(2).find(value => value.startsWith(prefix))?.slice(prefix.length);
}

/**
 * The newest request, because every click writes another one and the old files
 * stay. Reading an older one would validate against a brief nobody asked for.
 */
function readLatestRequest(workspace: string): { file: string; context: Record<string, unknown> }
{
  const directory = path.join(workspace, 'requests');
  const files = fs.existsSync(directory)
    ? fs.readdirSync(directory).filter(name => name.endsWith('.json')).sort()
    : [];

  if (files.length === 0) {
    throw new Error(`Brak zapisanego żądania w ${directory}. Kliknij raz w aplikacji, żeby je utworzyć.`);
  }

  const file = files[files.length - 1];
  return { file, context: JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8')) };
}

/**
 * Structured requirements keyed by identifier, read from a backup because the
 * request context carries only the prose sentence the model reads. Without the
 * structures nothing can tell whether an entry's demands are actually met.
 */
function readRequirementIndex(backupDirectory: string): Map<string, Requirement[]>
{
  const index = new Map<string, Requirement[]>();

  for (const model of ['Perk', 'Maneuver', 'Stance', 'State', 'Spell']) {
    const file = path.join(backupDirectory, `${model}.json`);
    if (!fs.existsSync(file)) continue;

    for (const record of JSON.parse(fs.readFileSync(file, 'utf8')) as { id?: string }[]) {
      const requirements = readStructuredRequirements(record as Parameters<typeof readStructuredRequirements>[0]);
      if (record.id && requirements.length > 0) index.set(record.id, requirements);
    }
  }

  return index;
}

/** Newest backup directory, so the usual run needs no arguments. */
function findNewestBackup(): string | undefined
{
  const root = path.resolve(process.cwd(), 'backup');
  if (!fs.existsSync(root)) return undefined;

  const directories = fs.readdirSync(root)
    .filter(name => fs.statSync(path.join(root, name)).isDirectory())
    .sort();

  return directories.length > 0 ? path.join(root, directories[directories.length - 1]) : undefined;
}

const report = (title: string, lines: readonly string[]) => {
  console.log(`\n--- ${title} ---`);
  console.log(lines.length > 0 ? lines.map(line => `  ${line}`).join('\n') : '  brak uwag');
};

function main(): void
{
  const workspace = path.resolve(process.cwd(), readArgument('workspace') ?? 'ai-workspace');
  const { file, context } = readLatestRequest(workspace);

  const draftFile = path.join(workspace, 'drafts', 'draft.json');
  if (!fs.existsSync(draftFile)) {
    throw new Error(`Brak ${draftFile}. Najpierw przygotuj propozycję.`);
  }

  // The request file is a serialized CharacterGenerationContext, so it is typed
  // as one rather than being described a second time here — a local shape would
  // drift from the contract the application actually writes.
  const request = context as unknown as CharacterGenerationContext;

  console.log(`Żądanie: ${file}`);
  console.log(`Draft:   ${path.relative(process.cwd(), draftFile)}`);

  let proposal;
  try {
    proposal = aiCharacterProposalSchema.parse(
      normalizeAiProposalIdentifiers(stripWireNulls(JSON.parse(fs.readFileSync(draftFile, 'utf8'))), {
        allowCustomEquipment: request.request.constraints.allowCustomEquipment,
        allowCustomAbilities: request.request.constraints.allowCustomAbilities,
        catalog: buildCatalogIdentityIndex(request.allowedCatalog.entries),
      }),
    );
    console.log('\nKontrakt Zod: przechodzi');
  } catch (error) {
    console.error('\nKontrakt Zod: NIE PRZECHODZI — draft nie wczyta się w ogóle.');
    const issues = (error as { issues?: { path?: unknown[]; message?: string }[] }).issues ?? [];
    for (const issue of issues.slice(0, 20)) {
      console.error(`  ${(issue.path ?? []).join('.')}: ${issue.message}`);
    }
    process.exitCode = 1;
    return;
  }

  const backup = readArgument('from-backup')
    ? path.resolve(process.cwd(), readArgument('from-backup')!)
    : findNewestBackup();

  const requirementIndex = backup ? readRequirementIndex(backup) : new Map<string, Requirement[]>();
  if (!backup) {
    console.warn('\nUwaga: nie znaleziono kopii w backup/, więc wymagania NIE zostały sprawdzone.');
    console.warn('Odpal `npm run backup-mongodb` albo podaj --from-backup=<katalog>.');
  }

  report('akceptacja', validateAiCharacterProposalForAcceptance(
    proposal,
    getAiCharacterGenerationAllowedReferences(request.references, request.allowedCatalog.entries),
    { allowCustomAbilities: request.request.constraints.allowCustomAbilities },
  ));

  report('wymagania', validateAiCharacterProposalRequirements(proposal, requirementIndex));
  report('mechanika walki', reviewAiCharacterProposalCombat(proposal));

  const subject = {
    attributes: proposal.statistics.attributes,
    maneuverCount: proposal.combat.maneuvers.length,
    perkCount: proposal.perks.length,
  };

  for (const profile of request.balanceProfiles ?? []) {
    const comparison = compareToBalanceProfile(subject, profile);
    console.log(`\n--- balans: ${comparison.tag} (${comparison.characters} postaci) ---`);
    console.log(`  specjalność ${comparison.speciality.name} ${comparison.speciality.value}`
      + ` (mediana ${comparison.speciality.median}, p90 ${comparison.speciality.high},`
      + ` max ${comparison.speciality.max}) — ${comparison.speciality.band}`);
    console.log(`  manewrów ${comparison.maneuvers.value} (mediana ${comparison.maneuvers.median},`
      + ` p90 ${comparison.maneuvers.high}) — ${comparison.maneuvers.band};`
      + ` atutów ${comparison.perks.value} (mediana ${comparison.perks.median}, p90 ${comparison.perks.high})`);

    for (const attribute of comparison.attributes.filter(a => a.band !== 'w normie' && a.value > 0)) {
      console.log(`  ${attribute.name} ${attribute.value} (mediana ${attribute.median},`
        + ` p90 ${attribute.high}, max ${attribute.max}) — ${attribute.band}`);
    }
  }

  console.log('\nUwagi nie blokują wczytania — trafiają do „Do poprawienia po zapisie".');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
