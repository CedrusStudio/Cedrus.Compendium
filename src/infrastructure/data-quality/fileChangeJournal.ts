import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { canonicalJson, contentHash, DataChangeBlockedError, DataChangeInputError, type PreparedChangeSet } from "@/domain/data-quality/dataChangeSet";
import { executeDataChangeSet, type ChangeDirection, type ChangeResult, type ContentDatabase } from "@/application/data-quality/dataChangeService";

export type BackupEvidence = { createdAt: string; manifestHash: string; collectionHashes: Record<string, string> };

function writeDurably(file: string, value: unknown): void
{
  const descriptor = openSync(file, "wx", 0o600);
  try { writeFileSync(descriptor, JSON.stringify(value, null, 2) + "\n", "utf8"); fsyncSync(descriptor); }
  finally { closeSync(descriptor); }
}

function replaceDurably(file: string, value: unknown): void
{
  const temporary = `${file}.${randomUUID()}.tmp`;
  writeDurably(temporary, value);
  try { renameSync(temporary, file); }
  finally { if (existsSync(temporary)) unlinkSync(temporary); }
}

/** Bind local journals to the database address without storing credentials. */
export function databaseTargetHash(connection: string): string
{
  const match = /^(mongodb(?:\+srv)?):\/\/(?:[^@/]+@)?([^/?]+)\/([^?]+)(?:\?.*)?$/.exec(connection);
  if (!match) throw new DataChangeInputError("A MongoDB connection with an explicit database name is required.");
  return contentHash({ protocol: match[1], hosts: match[2]!.toLowerCase(), database: match[3] });
}

const stateSchema = z.strictObject({
  batchHash: z.string(), targetHash: z.string(),
  status: z.enum(["applied", "already_applied", "rolled_back", "already_rolled_back"]),
});

export interface ChangeJournal
{
  run(prepared: PreparedChangeSet, database: ContentDatabase, direction: ChangeDirection, backup: BackupEvidence): Promise<ChangeResult>;
}

/** A flushed intent precedes the transaction; a receipt follows commit.
 * If commit succeeds but receipt I/O fails, the next attempt recovers by
 * comparing every current row with the intent's before/after hashes.
 */
export function fileChangeJournal(root: string, targetHash: string): ChangeJournal
{
  if (!/^[a-f0-9]{64}$/.test(targetHash)) throw new DataChangeInputError("Invalid journal target hash.");
  return {
    async run(prepared, database, direction, backup)
    {
      const directory = resolve(root, targetHash, prepared.batchHash);
      mkdirSync(directory, { recursive: true });
      const lock = join(directory, "operation.lock");
      let lockDescriptor: number;
      try { lockDescriptor = openSync(lock, "wx", 0o600); }
      catch (error)
      {
        if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") throw new DataChangeBlockedError(["Journal is locked. Preserve the files and check whether an earlier operation is still running."]);
        throw error;
      }
      try
      {
        writeFileSync(lockDescriptor, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
        fsyncSync(lockDescriptor);
        const intentPath = join(directory, "intent.json");
        const statePath = join(directory, "state.json");
        const intent = { schemaVersion: 1, targetHash, batchHash: prepared.batchHash, batch: prepared.batch, after: prepared.rows.map(row => row.after) };
        if (!existsSync(intentPath))
        {
          if (direction === "rollback") throw new DataChangeBlockedError(["Rollback requires the original apply journal."]);
          writeDurably(intentPath, intent);
        }
        else if (canonicalJson(JSON.parse(readFileSync(intentPath, "utf8"))) !== canonicalJson(intent))
        {
          throw new DataChangeBlockedError(["Journal intent does not match the reviewed batch and parsed output."]);
        }

        const state = existsSync(statePath) ? stateSchema.parse(JSON.parse(readFileSync(statePath, "utf8"))) : undefined;
        if (state && (state.batchHash !== prepared.batchHash || state.targetHash !== targetHash)) throw new DataChangeBlockedError(["Journal state belongs to another operation."]);
        const rolledBack = state?.status === "rolled_back" || state?.status === "already_rolled_back";
        if (rolledBack && direction === "apply") throw new DataChangeBlockedError(["This batch was rolled back. Prepare a new review identity before applying it again."]);
        const completed = direction === "apply" ? !!state : rolledBack;
        const eventId = randomUUID();
        // Saving this event must succeed before any database operation.
        writeDurably(join(directory, `${eventId}-started.json`), { direction, at: new Date().toISOString(), backup });
        let result: ChangeResult;
        try { result = await executeDataChangeSet(prepared, database, direction, completed); }
        catch (error)
        {
          writeDurably(join(directory, `${eventId}-failed.json`), { direction, at: new Date().toISOString(), outcome: "not_confirmed", code: error instanceof DataChangeBlockedError ? "conflict" : "database_failure" });
          throw error;
        }
        writeDurably(join(directory, `${eventId}-completed.json`), { direction, at: new Date().toISOString(), ...result });
        replaceDurably(statePath, { targetHash, batchHash: prepared.batchHash, status: result.status });
        return result;
      }
      finally
      {
        closeSync(lockDescriptor);
        unlinkSync(lock);
      }
    },
  };
}
