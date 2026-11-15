import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { readReviewBackup } from "../src/infrastructure/data-quality/reviewBackup";
import { preparePilotReview } from "../src/domain/data-quality/pilotReview";

try
{
  const argumentsList = process.argv.slice(2);
  if (argumentsList.length !== 3) throw new Error("Exactly three unique options are required.");
  const options = new Map(argumentsList.map(argument =>
  {
    const match = /^--(from-backup|source-revision|out)=(.+)$/.exec(argument);
    if (!match) throw new Error("Use --from-backup=<directory> --source-revision=<40-char SHA> --out=<new JSON file>.");
    return [match[1]!, match[2]!] as const;
  }));
  if (options.size !== 3 || !/^[a-f0-9]{40}$/.test(options.get("source-revision") ?? "")) throw new Error("All three unique options and an exact source revision are required.");
  const backup = readReviewBackup(options.get("from-backup")!);
  const bundle = preparePilotReview(backup.collections, { exportCreatedAt: backup.evidence.createdAt, sourceRevision: options.get("source-revision")! });
  const output = resolve(options.get("out")!);
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(bundle, null, 2) + "\n", { encoding: "utf8", flag: "wx", mode: 0o600 });
  console.log(JSON.stringify({ status: "draft", rows: bundle.rows.length, output, databaseWrites: 0 }, null, 2));
}
catch
{
  console.error("Pilot preparation failed. Check the three options, complete backup and unchanged source wording; the output must be a new file.");
  process.exitCode = 1;
}
