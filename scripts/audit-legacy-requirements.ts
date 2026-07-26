/**
 * Wave 6.1 — read-only audit of the unfinished legacy→structured requirements
 * migration.
 *
 * Why this exists: `structuredRequirements` became the only requirements model
 * the app reads (Wave 5, Faza 4c) and `requirements` was dropped from
 * `schema.prisma` (Faza 4c-full) — but the backfill was never applied to
 * production. Records that still carry only the legacy array render *nothing*
 * in the compendium (e.g. `Akrobatyka`), even though the text is intact in
 * Mongo. Prisma no longer knows the field, so this reads through `findRaw`.
 *
 * Writes nothing, ever. It reports four buckets per collection, decided per
 * legacy TEXT rather than per record:
 *   orphaned   — legacy text, nothing structured        → invisible in the UI
 *   partial    — structured exists but misses some text → that text is invisible
 *                AND would be destroyed by clear-legacy (the `Pogromienie` case)
 *   duplicated — every text is accounted for            → legacy is leftover
 *   clean      — no legacy text
 * plus a review queue of stored `ranked` requirements that disagree with the
 * legacy wording they came from (see `auditRankedMappings`).
 *
 * Run (Windows, resolves the `@/` alias via tsconfig paths):
 *   npm run audit-legacy-requirements
 *   npm run audit-legacy-requirements -- --csv legacy-requirements-audit.csv
 *
 * `node --experimental-strip-types` does NOT resolve the `@/` alias used by the
 * transitive domain imports — use the npm script (tsx).
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import prisma from '../src/lib/prisma';
import type { EntityRequirementGroup } from '../src/domain/requirements/Requirement';
import type { EntityNameOptions } from '../src/domain/requirements/suggestRequirementMapping';
import { formatRequirement } from '../src/domain/requirements/formatRequirement';
import {
  auditRankedMappings,
  classifyLegacyRecord,
  findUncoveredLegacyTexts,
  readLegacyTexts,
  readStructuredRequirements,
  toRanklessRequirements,
  type LegacyRequirementBucket,
  type MappingFinding,
} from '../src/domain/requirements/legacyRequirementAudit';

/** Minimal structural view of the raw access Prisma still allows on these models. */
type RawDelegate = {
  findRaw: (args: { filter?: Record<string, unknown>; options?: Record<string, unknown> }) => Promise<unknown>;
};

type Collection = { label: string; group: EntityRequirementGroup; delegate: RawDelegate };

const collections: ReadonlyArray<Collection> = [
  { label: 'perks', group: 'perks', delegate: prisma.perk as unknown as RawDelegate },
  { label: 'spells', group: 'spells', delegate: prisma.spell as unknown as RawDelegate },
  { label: 'maneuvers', group: 'maneuvers', delegate: prisma.maneuver as unknown as RawDelegate },
  { label: 'stances', group: 'stances', delegate: prisma.stance as unknown as RawDelegate },
  { label: 'states', group: 'states', delegate: prisma.state as unknown as RawDelegate },
];

type RawDoc = { _id?: unknown; name?: unknown; requirements?: unknown; structuredRequirements?: unknown };

type AuditRow = {
  collection: string;
  id: string;
  name: string;
  bucket: LegacyRequirementBucket;
  legacy: string[];
  /** Legacy texts nothing structured accounts for — invisible in the UI today. */
  uncovered: string[];
  structured: string[];
  findings: MappingFinding[];
};

/**
 * Reads every document of a collection, projected to the three fields that
 * matter. `findRaw` is the only way in: `requirements` was removed from the
 * Prisma schema, so a typed `findMany({ select: { requirements: true } })` — as
 * the pre-Wave-6 scripts did — no longer compiles, let alone returns the data.
 */
export async function readRawDocs(delegate: RawDelegate): Promise<RawDoc[]>
{
  const raw = await delegate.findRaw({
    filter: {},
    options: { projection: { name: 1, requirements: 1, structuredRequirements: 1 } },
  });

  return Array.isArray(raw) ? (raw as RawDoc[]) : [];
}

function docId(doc: RawDoc): string
{
  const id = doc._id;
  if (typeof id === 'string') return id;
  if (id && typeof id === 'object' && '$oid' in id) return String((id as { $oid: unknown }).$oid);
  return String(id ?? '');
}

function docName(doc: RawDoc): string
{
  return typeof doc.name === 'string' ? doc.name : '(bez nazwy)';
}

function describeFinding(finding: MappingFinding): string
{
  const suggested = finding.suggested ? formatRequirement(finding.suggested) : 'brak pewnej sugestii';
  const reason = finding.reason === 'target-differs' ? 'inny cel' : 'inna wartość';
  const texts = finding.legacyTexts.map((text) => `"${text}"`).join(', ');
  return `[${reason}] zapisano: ${formatRequirement(finding.stored)}; tekst legacy: ${texts}; matcher sugeruje: ${suggested}`;
}

function csvCell(value: string): string
{
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** UTF-8 BOM + CRLF, matching `classify-maneuvers.ts` so Excel reads Polish correctly. */
function toCsv(rows: AuditRow[]): string
{
  const headers = ['collection', 'id', 'name', 'bucket', 'legacy', 'uncovered', 'structured', 'findings'];
  const lines = [headers.join(',')];

  for (const row of rows)
  {
    lines.push([
      csvCell(row.collection),
      csvCell(row.id),
      csvCell(row.name),
      csvCell(row.bucket),
      csvCell(row.legacy.join(' | ')),
      csvCell(row.uncovered.join(' | ')),
      csvCell(row.structured.join(' | ')),
      csvCell(row.findings.map(describeFinding).join(' | ')),
    ].join(','));
  }

  return '﻿' + lines.join('\r\n') + '\r\n';
}

function csvPathFromArgs(): string | undefined
{
  const index = process.argv.indexOf('--csv');
  if (index === -1) return undefined;
  return process.argv[index + 1] ?? join(process.cwd(), 'legacy-requirements-audit.csv');
}

async function main(): Promise<void>
{
  const docsByCollection = new Map<string, RawDoc[]>();

  for (const { label, delegate } of collections)
  {
    docsByCollection.set(label, await readRawDocs(delegate));
  }

  // The matcher can only recognise an entity requirement if it knows the names,
  // so feed it the whole library we just read — no extra round trips.
  const entityNames: EntityNameOptions = {};
  for (const { label, group } of collections)
  {
    entityNames[group] = (docsByCollection.get(label) ?? []).map(docName);
  }

  const rows: AuditRow[] = [];
  const totals: Record<LegacyRequirementBucket, number> = { orphaned: 0, partial: 0, duplicated: 0, clean: 0 };

  for (const { label } of collections)
  {
    const docs = docsByCollection.get(label) ?? [];
    const counts: Record<LegacyRequirementBucket, number> = { orphaned: 0, partial: 0, duplicated: 0, clean: 0 };
    const invisible: AuditRow[] = [];
    const flagged: AuditRow[] = [];

    for (const doc of docs)
    {
      const bucket = classifyLegacyRecord(doc);
      counts[bucket] += 1;
      totals[bucket] += 1;

      const findings = auditRankedMappings(doc, entityNames);

      if (bucket === 'clean' && findings.length === 0)
      {
        continue;
      }

      const row: AuditRow = {
        collection: label,
        id: docId(doc),
        name: docName(doc),
        bucket,
        legacy: readLegacyTexts(doc),
        uncovered: findUncoveredLegacyTexts(doc),
        structured: readStructuredRequirements(doc).map(formatRequirement),
        findings,
      };

      rows.push(row);
      if (bucket === 'orphaned' || bucket === 'partial') invisible.push(row);
      if (findings.length > 0) flagged.push(row);
    }

    console.log(`\n[${label}] przeskanowano ${docs.length} — osierocone: ${counts.orphaned}, częściowe: ${counts.partial}, zduplikowane: ${counts.duplicated}, czyste: ${counts.clean}.`);

    for (const row of invisible)
    {
      const preview = toRanklessRequirements(row.uncovered).map((r) => `"${r.text}"`).join(', ');
      const marker = row.bucket === 'orphaned' ? 'OSIEROCONE' : 'CZĘŚCIOWE';
      console.log(`  ${marker} ${row.name} (${row.id}) → backfill dopisze: ${preview}`);
    }

    for (const row of flagged)
    {
      for (const finding of row.findings)
      {
        console.log(`  DO PRZEGLĄDU ${row.name} (${row.id}) ${describeFinding(finding)}`);
      }
    }
  }

  const invisibleTotal = totals.orphaned + totals.partial;

  console.log('\n=== PODSUMOWANIE ===');
  console.log(`Osierocone (nic structured — całe wymaganie niewidoczne): ${totals.orphaned}`);
  console.log(`Częściowe (structured nie pokrywa całego tekstu legacy): ${totals.partial}`);
  console.log(`Zduplikowane (legacy w pełni pokryte, do sprzątnięcia): ${totals.duplicated}`);
  console.log(`Czyste: ${totals.clean}`);
  console.log(`Wpisów do przeglądu (ranked vs. tekst legacy): ${rows.reduce((sum, row) => sum + row.findings.length, 0)}`);

  if (invisibleTotal > 0)
  {
    console.log(`\n${invisibleTotal} rekord(ów) ma tekst wymagania, którego UI nie pokazuje.`);
    console.log('Następny krok: npm run backfill-requirements  (dry run), potem -- --apply');
  }
  else
  {
    console.log('\nKażdy tekst legacy ma odpowiednik w structuredRequirements — backfill nie ma nic do zrobienia.');
  }

  console.log('Uwaga: backfill NIE poprawia błędnych mapowań `ranked` — te z sekcji DO PRZEGLĄDU popraw ręcznie w /admin/requirements.');

  const csvPath = csvPathFromArgs();
  if (csvPath)
  {
    writeFileSync(csvPath, toCsv(rows), 'utf8');
    console.log(`CSV → ${csvPath}`);
  }
}

main()
  .catch((error) => {
    console.error('Audyt wymagań legacy nie powiódł się.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
