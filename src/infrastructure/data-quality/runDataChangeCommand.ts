import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { prepareDataChangeSet, DataChangeBlockedError, DataChangeInputError } from "@/domain/data-quality/dataChangeSet";
import { inspectDataChangeSet, type ContentDatabase } from "@/application/data-quality/dataChangeService";
import { databaseTargetHash, fileChangeJournal } from "./fileChangeJournal";
import { readReviewBackup, requireWriteBackup } from "./reviewBackup";

export function parseDataChangeOptions(args: string[])
{
  const values = new Map<string, string>();
  const allowed = new Set(["bundle", "from-backup", "backup", "journal", "apply", "rollback"]);
  for (const argument of args)
  {
    const match = /^--([a-z-]+)(?:=(.+))?$/.exec(argument);
    if (!match || !allowed.has(match[1]!) || values.has(match[1]!)) throw new DataChangeInputError("Use unique --bundle=..., --from-backup=..., --backup=..., --journal=..., --apply or --rollback options.");
    const flag = match[1] === "apply" || match[1] === "rollback";
    if (flag === !!match[2]) throw new DataChangeInputError("Flags do not take values; paths require --option=value.");
    values.set(match[1]!, match[2] ?? "true");
  }
  if (!values.has("bundle")) throw new DataChangeInputError("--bundle=<review JSON> is required.");
  if (values.has("apply") && values.has("rollback")) throw new DataChangeInputError("Choose apply or rollback, not both.");
  const mode = values.has("apply") ? "apply" : values.has("rollback") ? "rollback" : "plan";
  if (mode !== "plan" && (values.has("from-backup") || !values.has("backup"))) throw new DataChangeInputError("Writes require --backup=<complete export> and cannot use an offline database.");
  return { mode, bundle: values.get("bundle")!, offline: values.get("from-backup"), backup: values.get("backup"), journal: values.get("journal") ?? "backup/data-change-journals" } as const;
}

type LiveConnection = { database: ContentDatabase; targetHash: string; close(): Promise<void> };
async function connectLive(): Promise<LiveConnection>
{
  const { default: prisma } = await import("@/lib/prisma");
  const { prismaContentDatabase } = await import("@/persistence/data-quality/prismaContentDatabase");
  const targetHash = databaseTargetHash(process.env.DATABASE_CONNECTION_STRING ?? "");
  return { database: prismaContentDatabase(prisma), targetHash, close: () => prisma.$disconnect() };
}

export async function runDataChangeCommand(args: string[], connect = connectLive)
{
  const options = parseDataChangeOptions(args);
  // Small batches are bounded before JSON parsing. Large raw database exports
  // are read separately and never accepted as mutation payloads.
  if (statSync(options.bundle).size > 1024 * 1024) throw new DataChangeInputError("Review bundle exceeds the 1 MiB limit.");
  const prepared = prepareDataChangeSet(JSON.parse(readFileSync(options.bundle, "utf8")));
  const summary = { batchId: prepared.batch.batchId, batchHash: prepared.batchHash, rows: prepared.rows.map(row => ({ reviewId: row.reviewId, collection: row.collection, before: row.before, proposed: row.patch, beforeHash: row.expectedHash, afterHash: row.afterHash })) };
  if (options.offline)
  {
    const backup = readReviewBackup(options.offline);
    const status = await inspectDataChangeSet(prepared, backup.store, "apply");
    return { ...summary, mode: "plan", status, source: "offline-backup", backup: backup.evidence };
  }
  const backup = options.mode !== "plan" ? readReviewBackup(options.backup!) : undefined;
  if (backup) await requireWriteBackup(backup, prepared, options.mode as "apply" | "rollback");
  const live = await connect();
  try
  {
    if (options.mode === "plan") return { ...summary, mode: "plan", status: await live.database.transaction(store => inspectDataChangeSet(prepared, store, "apply")), source: "database" };
    const journalRoot = resolve(options.journal);
    const result = await fileChangeJournal(journalRoot, live.targetHash).run(prepared, live.database, options.mode, backup!.evidence);
    return { ...summary, mode: options.mode, ...result, journalDirectory: resolve(journalRoot, live.targetHash, prepared.batchHash) };
  }
  finally { await live.close(); }
}

/** Only safe, bounded diagnostics; never echo a connection string/Prisma error. */
export function dataChangeFailure(error: unknown)
{
  if (error instanceof DataChangeInputError) return { status: "invalid", message: error.message };
  if (error instanceof DataChangeBlockedError) return { status: "blocked", issues: error.issues };
  if (error instanceof z.ZodError) return { status: "invalid", issues: error.issues.map(issue => ({ path: issue.path, message: issue.message })) };
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : undefined;
  if (code === "P2034") return { status: "conflict", message: "Concurrent database write. Inspect a fresh plan; no automatic retry was attempted." };
  return { status: "not_confirmed", message: "Operation did not complete normally. Preserve its bundle, backup and journal; inspect a fresh plan before retrying.", ...(code && ["EACCES", "EPERM", "ENOENT", "ENOSPC", "EIO", "EISDIR", "EEXIST", "P2028", "P2025"].includes(code) ? { code } : {}) };
}
