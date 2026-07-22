/**
 * Coverage report for maneuver effects — how far authoring has got. Reads the
 * live DB (read-only) and reports how many maneuvers are MAPPED (have effects),
 * QUEUED (no effects yet, not marked unsupported) or UNSUPPORTED
 * (simulatable=false), by record and by unique name.
 *
 * Usage:
 *   npx tsx scripts/maneuver-coverage.ts
 */

import prisma from "../src/lib/prisma";

type Row = { name: string; grade: number; effects: unknown; simulatable: boolean | null };

function bucket(r: Row): "mapped" | "unsupported" | "queued"
{
  if (Array.isArray(r.effects) && r.effects.length > 0) return "mapped";
  if (r.simulatable === false) return "unsupported";
  return "queued";
}

async function main(): Promise<void>
{
  // Cast away the (possibly stale) generated types for the new Json/Boolean fields.
  const rows = (await prisma.maneuver.findMany()) as unknown as Row[];

  const byRecord = { mapped: 0, unsupported: 0, queued: 0 };
  const nameBucket = new Map<string, "mapped" | "unsupported" | "queued">();

  for (const r of rows)
  {
    const b = bucket(r);
    byRecord[b] += 1;
    // A name counts as mapped if ANY of its grades is mapped; else unsupported if all unsupported; else queued.
    const prev = nameBucket.get(r.name);
    if (b === "mapped" || prev === "mapped") nameBucket.set(r.name, "mapped");
    else if (prev === undefined) nameBucket.set(r.name, b);
    else if (prev !== b) nameBucket.set(r.name, "queued");
  }

  const byName = { mapped: 0, unsupported: 0, queued: 0 };
  for (const b of nameBucket.values()) byName[b] += 1;

  const total = rows.length;
  const uniq = nameBucket.size;
  const pct = (n: number, d: number) => d > 0 ? `${((100 * n) / d).toFixed(1)}%` : "0%";

  console.log(`Manewrów (rekordów): ${total} · unikalnych nazw: ${uniq}\n`);
  console.log("Wg rekordów:");
  console.log(`  zmapowane:      ${String(byRecord.mapped).padStart(4)}  ${pct(byRecord.mapped, total)}`);
  console.log(`  w kolejce:      ${String(byRecord.queued).padStart(4)}  ${pct(byRecord.queued, total)}`);
  console.log(`  niesymulowalne: ${String(byRecord.unsupported).padStart(4)}  ${pct(byRecord.unsupported, total)}`);
  console.log("\nWg unikalnych nazw:");
  console.log(`  zmapowane:      ${String(byName.mapped).padStart(4)}  ${pct(byName.mapped, uniq)}`);
  console.log(`  w kolejce:      ${String(byName.queued).padStart(4)}  ${pct(byName.queued, uniq)}`);
  console.log(`  niesymulowalne: ${String(byName.unsupported).padStart(4)}  ${pct(byName.unsupported, uniq)}`);

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
