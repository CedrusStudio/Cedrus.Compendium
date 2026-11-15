/**
 * Import reviewed maneuver effects from the classification CSV into the database.
 * Milestone step of the maneuver-analysis plan: turns approved auto-proposals
 * (scripts/classify-maneuvers.ts) into real `effects` on the `Maneuver` records
 * so the simulator uses them.
 *
 * Safe by default: DRY RUN unless `--apply` is passed. Matches maneuvers by the
 * (name, grade) unique key. Every effect payload is validated against
 * `effectsAuthoringSchema` before it is accepted — a malformed hand-edit is skipped, not
 * written.
 *
 * Which rows are imported:
 *   • `approve` column is truthy ("tak"/"yes"/"x"/"1")  → import proposedEffects,
 *     set simulatable = true.
 *   • `--high` flag                                     → additionally import
 *     every row whose proposalConfidence = "high", even without an explicit
 *     approve (bootstrap the obvious cases).
 *   • `--mark-t3`                                       → for tier T3 rows with
 *     no effects, set simulatable = false and unsupportedReason from `markers`.
 *
 * Usage:
 *   npx tsx scripts/import-maneuver-effects.ts [csvPath]            # dry run (only approved rows)
 *   npx tsx scripts/import-maneuver-effects.ts --high               # dry run, incl. high-confidence
 *   npx tsx scripts/import-maneuver-effects.ts --medium             # dry run, incl. high+medium (auto-drafts)
 *   npx tsx scripts/import-maneuver-effects.ts --apply --medium --mark-t3
 *   # --all = --medium; every row with a proposal. Review the drafts in the app editor afterwards.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Prisma } from "@prisma/client";
import prisma from "../src/lib/prisma";
import { effectsAuthoringSchema } from "../src/domain/combat-lab/effects/effectAuthoringSchema";
import type { Effect } from "../src/domain/combat-lab/effects/Effect";

// ---- args -----------------------------------------------------------------

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const includeHigh = args.includes("--high") || args.includes("--medium") || args.includes("--all");
const includeMedium = args.includes("--medium") || args.includes("--all");
const markT3 = args.includes("--mark-t3");
const csvPath = args.find(a => !a.startsWith("--")) ?? join(process.cwd(), "maneuver-classification.csv");

// ---- tiny CSV parser (handles quotes, escaped "", CRLF, BOM) ---------------

function parseCsv(text: string): Record<string, string>[]
{
  const clean = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let field = "";
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++)
  {
    const ch = clean[i]!;
    if (inQuotes)
    {
      if (ch === '"')
      {
        if (clean[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      }
      else field += ch;
    }
    else if (ch === '"') inQuotes = true;
    else if (ch === ",") { record.push(field); field = ""; }
    else if (ch === "\n") { record.push(field); rows.push(record); record = []; field = ""; }
    else if (ch === "\r") { /* skip */ }
    else field += ch;
  }
  if (field.length > 0 || record.length > 0) { record.push(field); rows.push(record); }

  const header = rows.shift();
  if (!header) return [];
  return rows
    .filter(r => r.some(c => c.trim().length > 0))
    .map(r => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ""])));
}

const isTruthy = (v: string) => /^(tak|yes|y|x|1|true)$/i.test(v.trim());
const isUnsupportedMark = (v: string) => /^(nie|no|niesymulowaln\w*|unsupported)$/i.test(v.trim());

// ---- main -----------------------------------------------------------------

type Plan =
  | { name: string; grade: number; action: "effects"; effects: Effect[] }
  | { name: string; grade: number; action: "unsupported"; reason: string };

async function main(): Promise<void>
{
  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  console.log(`CSV: ${csvPath}  (${rows.length} wierszy)`);
  console.log(apply ? "TRYB: ZAPIS (--apply)\n" : "TRYB: PRÓBNY (dry run — nic nie zapisuję)\n");

  const plans: Plan[] = [];
  let skippedInvalid = 0;

  for (const row of rows)
  {
    const name = row.name?.trim();
    const grade = Number(row.grade);
    if (!name || Number.isNaN(grade)) continue;

    const approveVal = row.approve ?? "";
    const wantEffects = isTruthy(approveVal)
      || (includeHigh && row.proposalConfidence === "high")
      || (includeMedium && row.proposalConfidence === "medium");

    // Per-row "unsupported" mark from the editor (approve = "nie"): set
    // simulatable=false with the reviewer's reason. Takes precedence over the
    // bulk --mark-t3 heuristic.
    if (isUnsupportedMark(approveVal))
    {
      const reason = (row.unsupportedReason?.trim() || row.markers?.trim() || "poza modelem walki 1-na-1");
      plans.push({ name, grade, action: "unsupported", reason });
      continue;
    }

    if (wantEffects && row.proposedEffects)
    {
      let parsed: unknown;
      try { parsed = JSON.parse(row.proposedEffects); }
      catch { console.warn(`  ⚠ ${name} (r${grade}): proposedEffects to niepoprawny JSON — pomijam.`); skippedInvalid++; continue; }

      const list = Array.isArray(parsed) ? parsed : [parsed];
      const validated = effectsAuthoringSchema.safeParse(list);
      if (!validated.success)
      {
        const issues = validated.error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("; ");
        console.warn(`  ⚠ ${name} (r${grade}): ${issues} — pomijam.`);
        skippedInvalid++;
        continue;
      }

      plans.push({ name, grade, action: "effects", effects: validated.data });
    }
    else if (markT3 && row.tier === "T3")
    {
      const reason = (row.markers?.trim() || "poza modelem walki 1-na-1");
      plans.push({ name, grade, action: "unsupported", reason });
    }
  }

  const effCount = plans.filter(p => p.action === "effects").length;
  const unsupCount = plans.filter(p => p.action === "unsupported").length;
  console.log(`Do zaimportowania: ${effCount} z efektami, ${unsupCount} oznaczonych jako niesymulowalne, ${skippedInvalid} pominiętych (błędne).\n`);

  let written = 0;
  let notFound = 0;

  for (const plan of plans)
  {
    const record = await prisma.maneuver.findFirst({ where: { name: plan.name, grade: plan.grade }, select: { id: true } });
    if (!record) { console.warn(`  ✗ brak w bazie: ${plan.name} (r${plan.grade})`); notFound++; continue; }

    // Built as a loose object and cast at the call site: the generated Prisma
    // type only gains `effects`/`simulatable`/`unsupportedReason` after
    // `prisma generate` runs against the updated schema. The cast is a no-op
    // once the client is regenerated.
    const data: Record<string, unknown> = plan.action === "effects"
      ? { effects: plan.effects, simulatable: true, unsupportedReason: null }
      : { simulatable: false, unsupportedReason: plan.reason };

    if (apply)
    {
      await prisma.maneuver.update({ where: { id: record.id }, data: data as unknown as Prisma.ManeuverUpdateInput });
      written++;
    }
    else
    {
      const detail = plan.action === "effects" ? `${(plan.effects as unknown[]).length} efekt(ów)` : `niesymulowalny: ${plan.reason}`;
      console.log(`  • ${plan.name} (r${plan.grade}) → ${detail}`);
    }
  }

  if (apply) console.log(`\nZapisano: ${written}. Nie znaleziono w bazie: ${notFound}.`);
  else console.log(`\n(Próbny) Gotowych do zapisu: ${plans.length - notFound}. Uruchom ponownie z --apply, aby zapisać.`);

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
