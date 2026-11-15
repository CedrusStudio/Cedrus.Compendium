/**
 * Inspect legacy stance/state-classification CSV proposals without writing data.
 * `--apply` is refused; use reviewed ID/hash changes in scripts/data-change-set.ts.
 * Usage: npx tsx scripts/import-mode-effects.ts <stance|state> <csvPath> [--high|--medium]
 */

import { readFileSync } from "node:fs";
import prisma from "../src/lib/prisma";
import { effectsAuthoringSchema } from "../src/domain/combat-lab/effects/effectAuthoringSchema";
import type { Effect } from "../src/domain/combat-lab/effects/Effect";

const args = process.argv.slice(2);
const positional = args.filter(a => !a.startsWith("--"));
const kind = (positional[0] === "state" ? "state" : "stance") as "stance" | "state";
const csvPath = positional[1];
if (!csvPath) { console.error("Podaj: <stance|state> <ścieżka-csv> [--apply --high --medium --mark-t3]"); process.exit(1); }

const apply = args.includes("--apply");
const includeHigh = args.includes("--high") || args.includes("--medium") || args.includes("--all");
const includeMedium = args.includes("--medium") || args.includes("--all");
const markT3 = args.includes("--mark-t3");

function parseCsv(text: string): Record<string, string>[]
{
  const clean = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let field = ""; let record: string[] = []; let inQuotes = false;
  for (let i = 0; i < clean.length; i++)
  {
    const ch = clean[i]!;
    if (inQuotes)
    {
      if (ch === '"') { if (clean[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
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
  return rows.filter(r => r.some(c => c.trim().length > 0))
    .map(r => Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ""])));
}

const isTruthy = (v: string) => /^(tak|yes|y|x|1|true)$/i.test(v.trim());
const isUnsupportedMark = (v: string) => /^(nie|no|niesymulowaln\w*|unsupported)$/i.test(v.trim());

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

  const rows = parseCsv(readFileSync(csvPath!, "utf8"));
  console.log(`Kolekcja: ${kind}  ·  CSV: ${csvPath}  (${rows.length} wierszy)`);
  console.log("TRYB: PRÓBNY (podgląd CSV, bez zapisu)\n");

  const plans: Plan[] = [];
  let skippedInvalid = 0;

  for (const row of rows)
  {
    const name = row.name?.trim();
    const grade = Number(row.grade);
    if (!name || Number.isNaN(grade)) continue;

    const approveVal = row.approve ?? "";
    if (isUnsupportedMark(approveVal))
    {
      const reason = (row.unsupportedReason?.trim() || row.markers?.trim() || "poza modelem walki 1-na-1");
      plans.push({ name, grade, action: "unsupported", reason });
      continue;
    }

    const wantEffects = isTruthy(approveVal)
      || (includeHigh && row.proposalConfidence === "high")
      || (includeMedium && row.proposalConfidence === "medium");

    if (wantEffects && row.proposedEffects)
    {
      let parsed: unknown;
      try { parsed = JSON.parse(row.proposedEffects); }
      catch { console.warn(`  ⚠ ${name} (r${grade}): niepoprawny JSON — pomijam.`); skippedInvalid++; continue; }
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
      plans.push({ name, grade, action: "unsupported", reason: (row.markers?.trim() || "poza modelem walki 1-na-1") });
    }
  }

  const effCount = plans.filter(p => p.action === "effects").length;
  const unsupCount = plans.filter(p => p.action === "unsupported").length;
  console.log(`Do zaimportowania: ${effCount} z efektami, ${unsupCount} niesymulowalne, ${skippedInvalid} pominięte.\n`);

  // The two delegates have identical shapes here; a union isn't callable, so
  // narrow to a minimal structural interface.
  const delegate = (kind === "state" ? prisma.state : prisma.stance) as unknown as {
    findFirst(args: unknown): Promise<{ id: string } | null>;
  };
  let notFound = 0;

  for (const plan of plans)
  {
    const record = await delegate.findFirst({ where: { name: plan.name, grade: plan.grade }, select: { id: true } });
    if (!record) { console.warn(`  ✗ brak w bazie: ${plan.name} (r${plan.grade})`); notFound++; continue; }

    const detail = plan.action === "effects" ? `${plan.effects.length} efekt(ów)` : `niesymulowalny: ${plan.reason}`;
    console.log(`  • ${plan.name} (r${plan.grade}) → ${detail}`);
  }

  console.log(`\n(Próbny) Propozycje: ${plans.length - notFound}. Zapis wymaga zatwierdzonego pakietu scripts/data-change-set.ts.`);

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
