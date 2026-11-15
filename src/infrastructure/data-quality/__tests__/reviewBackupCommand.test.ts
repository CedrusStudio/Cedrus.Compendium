import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve, sep } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { approvedReview, reviewRecords } from "@/__tests__/fixtures/dataChangeSet";
import { memoryContentDatabase } from "@/__tests__/fixtures/contentDatabase";
import { prepareDataChangeSet } from "@/domain/data-quality/dataChangeSet";
import { databaseTargetHash } from "../fileChangeJournal";
import { readReviewBackup, requireWriteBackup } from "../reviewBackup";
import { dataChangeFailure, parseDataChangeOptions, runDataChangeCommand } from "../runDataChangeCommand";

const directories: string[] = [];
function setup()
{
  const directory = mkdtempSync(join(tmpdir(), "cedrus-data-change-test-"));
  directories.push(directory);
  const bundle = join(directory, "review.json");
  writeFileSync(bundle, JSON.stringify(approvedReview()));
  function backup(name: string, records = reviewRecords())
  {
    const folder = join(directory, name);
    mkdirSync(folder);
    const collections = Prisma.dmmf.datamodel.models.map(({ name: model }) => ({ model, count: model === "Maneuver" ? records.length : 0 }));
    writeFileSync(join(folder, "_manifest.json"), JSON.stringify({ createdAt: "2026-11-15T19:00:00.000Z", totalDocuments: records.length, collections }));
    for (const { model } of collections) writeFileSync(join(folder, `${model}.json`), JSON.stringify(model === "Maneuver" ? records : []));
    return folder;
  }
  return { directory, bundle, backup };
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

it.each([
  [], ["--bundle=x", "--apply", "--rollback"], ["--bundle=x", "--apply"],
  ["--bundle=x", "--apply", "--backup=b", "--from-backup=c"], ["--bundle=x", "--apply=false"],
  ["--bundle=x", "--bundle=y"], ["--bundle=x", "--typo=y"], ["--bundle=x", "positional"],
].map(args => ({ args })))("rejects ambiguous/incomplete command options: $args", ({ args }) => expect(() => parseDataChangeOptions(args)).toThrow());

it("validates backup completeness, counts and before/after content", async () =>
{
  const { backup } = setup();
  const folder = backup("before");
  const read = readReviewBackup(folder);
  const prepared = prepareDataChangeSet(approvedReview());
  await expect(requireWriteBackup(read, prepared, "apply")).resolves.toBeUndefined();
  await expect(requireWriteBackup(read, prepared, "rollback")).rejects.toThrow("after");
  writeFileSync(join(folder, "State.json"), JSON.stringify([{}]));
  expect(() => readReviewBackup(folder)).toThrow("count mismatch");
});

it("rejects missing or duplicate collections and stale backup sources", async () =>
{
  const { backup } = setup();
  const folder = backup("bad");
  const manifestPath = join(folder, "_manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  writeFileSync(manifestPath, JSON.stringify({ ...manifest, createdAt: "2026-01-01T00:00:00.000Z" }));
  await expect(requireWriteBackup(readReviewBackup(folder), prepareDataChangeSet(approvedReview()), "apply")).rejects.toThrow("predates");
  writeFileSync(manifestPath, JSON.stringify({ ...manifest, collections: [manifest.collections[0], manifest.collections[0]] }));
  expect(() => readReviewBackup(folder)).toThrow("missing or duplicate");
});

it("plans offline by default and never connects or writes", async () =>
{
  const { bundle, backup } = setup();
  const connect = vi.fn();
  const result = await runDataChangeCommand([`--bundle=${bundle}`, `--from-backup=${backup("source")}`], connect);
  expect(result).toMatchObject({ mode: "plan", status: "ready", source: "offline-backup" });
  expect(connect).not.toHaveBeenCalled();
});

it("blocks an unreviewed batch and oversized input before database access", async () =>
{
  const { bundle } = setup();
  const batch = approvedReview(); batch.rows[1]!.reviewState = "needs-decision";
  writeFileSync(bundle, JSON.stringify(batch));
  const connect = vi.fn();
  await expect(runDataChangeCommand([`--bundle=${bundle}`], connect)).rejects.toThrow("not ready");
  writeFileSync(bundle, " ".repeat(1024 * 1024 + 1));
  await expect(runDataChangeCommand([`--bundle=${bundle}`], connect)).rejects.toThrow("1 MiB");
  expect(connect).not.toHaveBeenCalled();
});

it("plans live without mutations, applies once, then rolls back using a fresh after backup", async () =>
{
  const { directory, bundle, backup } = setup();
  const memory = memoryContentDatabase();
  const close = vi.fn(async () => {});
  const connect = vi.fn(async () => ({ database: memory.database, targetHash: databaseTargetHash("mongodb://localhost/test"), close }));
  expect(await runDataChangeCommand([`--bundle=${bundle}`], connect)).toMatchObject({ status: "ready" });
  expect(memory.writes).toEqual([]);
  const apply = [`--bundle=${bundle}`, "--apply", `--backup=${backup("before")}`, `--journal=${join(directory, "journal")}`];
  expect(await runDataChangeCommand(apply, connect)).toMatchObject({ status: "applied" });
  expect(await runDataChangeCommand(apply, connect)).toMatchObject({ status: "already_applied" });
  expect(memory.writes).toHaveLength(2);
  const after = backup("after", [...memory.records.values()]);
  expect(await runDataChangeCommand([`--bundle=${bundle}`, "--rollback", `--backup=${after}`, `--journal=${join(directory, "journal")}`], connect)).toMatchObject({ status: "rolled_back" });
  expect([...memory.records.values()]).toEqual(reviewRecords());
  expect(close).toHaveBeenCalledTimes(4);
});

it("returns bounded conflict/error diagnostics without leaking a Prisma connection string", () =>
{
  expect(dataChangeFailure({ code: "P2034", message: "mongodb://secret:password@example/db" })).toMatchObject({ status: "conflict" });
  expect(JSON.stringify(dataChangeFailure(new Error("mongodb://secret:password@example/db")))).not.toContain("secret");
});
