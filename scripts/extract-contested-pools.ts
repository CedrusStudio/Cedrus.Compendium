/**
 * Extract the skill/attribute names used in contested-test (T2c) maneuvers so a
 * human can confirm the PL → character-field mapping and spot any names outside
 * the known table. Step 1 of the contested-test plan
 * (features-to-implement/combat-lab-contested-test-plan.md).
 *
 * READ-ONLY. Reads the backup's Maneuver.json (offline). Writes a review CSV and
 * prints a summary: known-stat frequencies + a ranked list of UNKNOWN candidate
 * tokens (things that look like pool names but aren't in the mapping yet).
 *
 * Usage:
 *   npx tsx scripts/extract-contested-pools.ts [backupManeuverJsonPath] [outCsvPath]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// PL pool name → character field (from the plan §4). Multi-word names first.
const KNOWN: { name: string; field: string }[] = [
  { name: "walka wręcz", field: "attributes.martialArt" },
  { name: "fechtunek", field: "attributes.fencing" },
  { name: "fortel", field: "attributes.artifice" },
  { name: "precyzja", field: "attributes.precision" },
  { name: "inicjatywa", field: "attributes.initiative" },
  { name: "jeździectwo", field: "attributes.horsemanship" },
  { name: "wytrzymałość", field: "attributes.fortitude" },
  { name: "refleks", field: "attributes.reflex" },
  { name: "wola", field: "attributes.willpower" },
  { name: "siła", field: "characteristics.strength" },
  { name: "kondycja", field: "characteristics.constitution" },
  { name: "zręczność", field: "characteristics.dexterity" },
  { name: "umysł", field: "characteristics.mind" },
  { name: "charyzma", field: "characteristics.charisma" },
  { name: "czarokrwistość", field: "characteristics.spellborn" },
];

// Match inflected forms: strip trailing letters. We test each known stem as a
// prefix on lowercased tokens (Polish declension → "refleksu", "siły", "fechtunku").
const STEMS = KNOWN.map(k => ({ ...k, stem: k.name.slice(0, Math.max(4, k.name.length - 2)) }));

// Common non-stat words that appear in test clauses (so they aren't flagged).
const STOP = new Set([
  "test", "sporny", "spornego", "spornym", "przewagi", "przewaga", "oczko", "każde", "każdą",
  "dodaje", "dodaj", "dodajesz", "wygrany", "powoduje", "obrażeń", "obrażenia", "tylko", "przeciw",
  "kość", "kości", "broni", "wynik", "wyniku", "modyfikator", "dowolnego", "wymierzonego", "przeciwko",
  "tobie", "ciebie", "oraz", "jego", "twojej", "twój", "przy", "ponawiasz", "rzut", "rzuca", "rzucasz",
  "usunięcie", "dorzucenie", "dodatkowej", "najgorszym", "wynikiem", "równych", "równa", "równy",
]);

type ManeuverRecord = { name: string; grade: number; description: string };

function newestBackup(): string
{
  const root = join(process.cwd(), "backup");
  const dirs = readdirSync(root).filter(d => existsSync(join(root, d, "Maneuver.json"))).sort().reverse();
  if (!dirs.length) throw new Error("Brak backup/<timestamp>/Maneuver.json");
  return join(root, dirs[0]!, "Maneuver.json");
}

function testClause(text: string): string
{
  const i = text.toLowerCase().indexOf("test");
  if (i < 0) return "";
  const rest = text.slice(i);
  const end = rest.indexOf(".");
  return (end < 0 ? rest : rest.slice(0, end)).trim();
}

function knownStatsIn(clause: string): string[]
{
  const lower = clause.toLowerCase();
  return STEMS.filter(s => lower.includes(s.stem)).map(s => `${s.name}→${s.field}`);
}

function unknownTokensIn(clause: string): string[]
{
  const lower = clause.toLowerCase();
  // Remove known multi/single stems so their tokens don't count as unknown.
  let stripped = lower;
  for (const s of STEMS) stripped = stripped.split(s.stem).join(" ");
  const tokens = stripped.split(/[^a-ząćęłńóśźż]+/i).filter(t => t.length >= 4 && !STOP.has(t));
  return [...new Set(tokens)];
}

function csvCell(v: string | number): string { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }

function main(): void
{
  const inPath = process.argv[2] ?? newestBackup();
  const outPath = process.argv[3] ?? join(process.cwd(), "contested-pools-review.csv");
  const records = (JSON.parse(readFileSync(inPath, "utf8")) as ManeuverRecord[]).filter(r => r.description);

  const t2c = records.filter(r => /\btest\b/i.test(r.description));
  const rows: Record<string, string | number>[] = [];
  const knownFreq = new Map<string, number>();
  const unknownFreq = new Map<string, string>();  // token → example maneuver
  const unknownCount = new Map<string, number>();

  for (const r of t2c)
  {
    const clause = testClause(r.description);
    const known = knownStatsIn(clause);
    const unknown = unknownTokensIn(clause);
    for (const k of known) knownFreq.set(k, (knownFreq.get(k) ?? 0) + 1);
    for (const u of unknown) { unknownCount.set(u, (unknownCount.get(u) ?? 0) + 1); if (!unknownFreq.has(u)) unknownFreq.set(u, r.name); }
    rows.push({ name: r.name, grade: r.grade, knownStats: known.join("; "), unknownTokens: unknown.join("; "), testClause: clause });
  }

  const header = ["name", "grade", "knownStats", "unknownTokens", "testClause"];
  const csv = "﻿" + [header.join(",")].concat(rows.map(row => header.map(h => csvCell(row[h] ?? "")).join(","))).join("\r\n") + "\r\n";
  writeFileSync(outPath, csv, "utf8");

  console.log(`Wejście: ${inPath}`);
  console.log(`Manewrów z testem spornym: ${t2c.length}\n`);
  console.log("Znane staty (częstość):");
  [...knownFreq.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  ${String(n).padStart(4)}  ${k}`));

  const unknownSorted = [...unknownCount.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]);
  console.log(`\nNIEZNANE tokeny-kandydaci (≥2 wystąpień) — do przejrzenia:`);
  unknownSorted.slice(0, 40).forEach(([t, n]) => console.log(`  ${String(n).padStart(4)}  ${t}   (np. „${unknownFreq.get(t)}")`));
  console.log(`\nCSV → ${outPath}`);
}

main();
