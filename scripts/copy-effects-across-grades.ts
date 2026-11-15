/**
 * Preview possible copies across maneuver grades. Values are unapproved drafts:
 * every rank requires its own numerical and semantic review. No data is written;
 * `--apply` is refused before database reads. Use scripts/data-change-set.ts.
 * Usage: npx tsx scripts/copy-effects-across-grades.ts
 */

import prisma from "../src/lib/prisma";

type Row = { id: string; name: string; grade: number; effects: unknown; simulatable: boolean | null; unsupportedReason: string | null };

const apply = process.argv.includes("--apply");

const isAuthored = (r: Row) => (Array.isArray(r.effects) && r.effects.length > 0) || r.simulatable === false;
const isEmpty = (r: Row) => !(Array.isArray(r.effects) && r.effects.length > 0) && r.simulatable !== false;

async function main(): Promise<void>
{
  if (apply)
  {
    console.error("Zapis niezatwierdzonych kopii rang jest wyłączony. Przejrzyj każdą rangę w pakiecie scripts/data-change-set.ts (scripts/README.md).");
    process.exitCode = 1;
    await prisma.$disconnect();
    return;
  }

  const rows = (await prisma.maneuver.findMany()) as unknown as Row[];

  const byName = new Map<string, Row[]>();
  for (const r of rows) { const g = byName.get(r.name) ?? []; g.push(r); byName.set(r.name, g); }

  type Plan = { id: string; name: string; grade: number; fromGrade: number; data: Record<string, unknown> };
  const plans: Plan[] = [];

  for (const [name, group] of byName)
  {
    if (group.length < 2) continue;
    const authored = group.filter(isAuthored).sort((a, b) => a.grade - b.grade);
    if (authored.length === 0) continue;
    const source = authored[0]!;

    for (const target of group)
    {
      if (target.id === source.id || !isEmpty(target)) continue;
      const data: Record<string, unknown> = {};
      if (Array.isArray(source.effects) && source.effects.length > 0) { data.effects = source.effects; data.simulatable = true; }
      else if (source.simulatable === false) { data.simulatable = false; data.unsupportedReason = source.unsupportedReason; }
      if (Object.keys(data).length === 0) continue;
      plans.push({ id: target.id, name, grade: target.grade, fromGrade: source.grade, data });
    }
  }

  console.log("TRYB: PRÓBNY (podgląd propozycji, bez zapisu)\n");
  console.log(`Do skopiowania: ${plans.length} wariantów rang (z ${byName.size} nazw).`);
  console.log("Uwaga: liczby skalują się z rangą — skopiowane efekty to DRAFT do dostrojenia.\n");

  const preview = plans.slice(0, 30);
  for (const p of preview) console.log(`  • ${p.name}: r${p.fromGrade} → r${p.grade}`);
  if (plans.length > preview.length) console.log(`  … i ${plans.length - preview.length} więcej`);

  console.log("\n(Próbny) Każda ranga wymaga osobnego przeglądu w pakiecie scripts/data-change-set.ts.");

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
