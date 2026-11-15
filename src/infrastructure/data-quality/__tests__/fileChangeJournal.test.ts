import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, rmdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { afterEach, expect, it } from "vitest";
import { approvedReview } from "@/__tests__/fixtures/dataChangeSet";
import { memoryContentDatabase } from "@/__tests__/fixtures/contentDatabase";
import { prepareDataChangeSet } from "@/domain/data-quality/dataChangeSet";
import { databaseTargetHash, fileChangeJournal } from "../fileChangeJournal";

const directories: string[] = [];
const target = databaseTargetHash("mongodb://user:synthetic-password@localhost:27017/test_db");
const backup = { createdAt: "2026-11-15T18:38:23.881Z", manifestHash: "a".repeat(64), collectionHashes: {} };
function setup()
{
  const root = mkdtempSync(join(tmpdir(), "cedrus-data-change-test-"));
  directories.push(root);
  const prepared = prepareDataChangeSet(approvedReview());
  return { root, prepared, directory: join(root, target, prepared.batchHash), journal: fileChangeJournal(root, target), memory: memoryContentDatabase() };
}
afterEach(() =>
{
  for (const directory of directories.splice(0))
  {
    const absolute = resolve(directory);
    if (!absolute.startsWith(resolve(tmpdir()) + sep) || !basename(absolute).startsWith("cedrus-data-change-test-")) throw new Error("Invalid test cleanup target.");
    rmSync(absolute, { recursive: true, force: true });
  }
});

it("binds journals to a credential-free database identity", () =>
{
  expect(target).toBe(databaseTargetHash("mongodb://other:changed-password@LOCALHOST:27017/test_db?authSource=admin"));
  expect(target).not.toBe(databaseTargetHash("mongodb://localhost:27017/another_db"));
  expect(() => databaseTargetHash("not-a-connection")).toThrow();
});

it("flushes before/after evidence, tracks retries and guarded rollback, and blocks reapplication", async () =>
{
  const { journal, prepared, memory, directory } = setup();
  expect((await journal.run(prepared, memory.database, "apply", backup)).status).toBe("applied");
  const intent = JSON.parse(readFileSync(join(directory, "intent.json"), "utf8"));
  expect(intent.batch.rows[0].before.description).toBe("Original 0");
  expect(intent.after[0].description).toBe("Corrected 0");
  expect((await journal.run(prepared, memory.database, "apply", backup)).status).toBe("already_applied");
  expect(memory.writes).toHaveLength(2);
  expect((await journal.run(prepared, memory.database, "rollback", backup)).status).toBe("rolled_back");
  expect((await journal.run(prepared, memory.database, "rollback", backup)).status).toBe("already_rolled_back");
  await expect(journal.run(prepared, memory.database, "apply", backup)).rejects.toThrow("rolled back");
  expect(memory.writes).toHaveLength(4);
  expect(existsSync(join(directory, "operation.lock"))).toBe(false);
});

it("recovers a committed batch whose receipt could not be saved without writing twice", async () =>
{
  const { journal, prepared, memory, directory } = setup();
  const failingReceiptDatabase = { transaction: async <T,>(work: Parameters<typeof memory.database.transaction<T>>[0]) =>
  {
    const result = await memory.database.transaction(work);
    mkdirSync(join(directory, "state.json"));
    return result;
  } };
  await expect(journal.run(prepared, failingReceiptDatabase, "apply", backup)).rejects.toThrow();
  expect(memory.writes).toHaveLength(2);
  rmdirSync(join(directory, "state.json"));
  expect((await journal.run(prepared, memory.database, "apply", backup)).status).toBe("already_applied");
  expect(memory.writes).toHaveLength(2);
});

it("blocks rollback without its intent, tampered evidence and an abandoned/concurrent lock", async () =>
{
  const { journal, prepared, memory, directory } = setup();
  await expect(journal.run(prepared, memory.database, "rollback", backup)).rejects.toThrow("original apply journal");
  expect(memory.transactions).toBe(0);
  writeFileSync(join(directory, "operation.lock"), "prior operation");
  await expect(journal.run(prepared, memory.database, "apply", backup)).rejects.toThrow("locked");
  rmSync(join(directory, "operation.lock"));
  writeFileSync(join(directory, "intent.json"), "{}");
  await expect(journal.run(prepared, memory.database, "apply", backup)).rejects.toThrow("does not match");
  expect(memory.transactions).toBe(0);
});

it("preserves intent and records a failed atomic attempt without advancing completion state", async () =>
{
  const { journal, prepared, memory, directory } = setup();
  memory.failWrite(2);
  await expect(journal.run(prepared, memory.database, "apply", backup)).rejects.toThrow("Synthetic failure");
  expect(memory.writes).toEqual([]);
  expect(existsSync(join(directory, "intent.json"))).toBe(true);
  expect(existsSync(join(directory, "state.json"))).toBe(false);
  expect(readdirSync(directory).some(file => file.endsWith("-failed.json"))).toBe(true);
});
