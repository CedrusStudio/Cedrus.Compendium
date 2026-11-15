/** Offline validation of effect payloads in an existing backup-mongodb export.
 * No database client is imported and no files are modified.
 * Usage: node --import ./scripts/ts-alias-hooks.mjs scripts/audit-effect-authoring.ts backup/<snapshot>
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { effectsAuthoringSchema } from "../src/domain/combat-lab/effects/effectAuthoringSchema";

function auditCollection(directory: string, collection: string)
{
  const records: unknown = JSON.parse(readFileSync(resolve(directory, `${collection}.json`), "utf8"));
  if (!Array.isArray(records)) throw new Error(`${collection}.json must contain an array.`);

  let withEffects = 0;
  let effectCount = 0;
  const invalid: { index: number; issues: { path: PropertyKey[]; message: string }[] }[] = [];
  records.forEach((record: unknown, index: number) =>
  {
    if (!record || typeof record !== "object" || Array.isArray(record))
    {
      invalid.push({ index, issues: [{ path: [], message: "Expected a record object." }] });
      return;
    }

    const effects = "effects" in record ? record.effects : undefined;
    if (effects == null) return;
    if (Array.isArray(effects) && effects.length > 0)
    {
      withEffects++;
      effectCount += effects.length;
    }

    const parsed = effectsAuthoringSchema.safeParse(effects);
    if (!parsed.success) invalid.push({ index, issues: parsed.error.issues.map(({ path, message }) => ({ path, message })) });
  });

  return { collection, records: records.length, withEffects, effectCount, invalid };
}

try
{
  const directory = process.argv[2];
  if (!directory) throw new Error("Pass the directory of an existing backup-mongodb snapshot.");
  const report = ["Maneuver", "Stance", "State"].map(collection => auditCollection(directory, collection));
  console.log(JSON.stringify(report, null, 2));
  if (report.some(item => item.invalid.length > 0)) process.exitCode = 1;
}
catch (error)
{
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
