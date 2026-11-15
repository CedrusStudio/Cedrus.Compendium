/**
 * Inspect legacy maneuver-classification CSV proposals without writing data.
 * Uses the shared strict authoring parser; preserves approval/confidence filters.
 * `--apply` is refused before file/database reads. Publish reviewed ID/hash
 * changes with scripts/data-change-set.ts; see scripts/README.md.
 * Usage: npx tsx scripts/import-maneuver-effects.ts [csvPath] [--high|--medium] [--mark-t3]
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
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
  if (apply)
  {
    console.error("Zapis ze starego CSV jest wyłączony. Przygotuj zatwierdzony pakiet ID/hash i użyj scripts/data-change-set.ts (scripts/README.md).");
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const rows = parseCsv(readFileSync(csvPath, "utf8"));
  console.log(`CSV: ${csvPath}  (${rows.length} wierszy)`);
  console.log("TRYB: PRÓBNY (podgląd CSV, bez zapisu)\n");

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

  let notFound = 0;

  for (const plan of plans)
  {
    const record = await prisma.maneuver.findFirst({ where: { name: plan.name, grade: plan.grade }, select: { id: true } });
    if (!record) { console.warn(`  ✗ brak w bazie: ${plan.name} (r${plan.grade})`); notFound++; continue; }

    const detail = plan.action === "effects" ? `${plan.effects.length} efekt(ów)` : `niesymulowalny: ${plan.reason}`;
    console.log(`  • ${plan.name} (r${plan.grade}) → ${detail}`);
  }

  console.log(`\n(Próbny) Propozycje: ${plans.length - notFound}. Zapis wymaga zatwierdzonego pakietu scripts/data-change-set.ts.`);

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
