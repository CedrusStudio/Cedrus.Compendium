import { expect, it } from "vitest";
import { approvedReview, reviewRecords } from "@/__tests__/fixtures/dataChangeSet";
import { memoryContentDatabase } from "@/__tests__/fixtures/contentDatabase";
import { prepareDataChangeSet } from "@/domain/data-quality/dataChangeSet";
import { executeDataChangeSet, inspectDataChangeSet } from "../dataChangeService";

it("applies the entire batch, recognizes retries and rolls back only changed fields", async () =>
{
  const initial = reviewRecords().map(row => ({ ...row, characterIds: ["private-relation"] }));
  const memory = memoryContentDatabase(initial);
  const prepared = prepareDataChangeSet(approvedReview(initial));
  expect((await executeDataChangeSet(prepared, memory.database, "apply")).status).toBe("applied");
  expect(memory.writes).toHaveLength(2);
  expect((await executeDataChangeSet(prepared, memory.database, "apply", true)).status).toBe("already_applied");
  expect(memory.writes).toHaveLength(2);
  expect((await executeDataChangeSet(prepared, memory.database, "rollback")).status).toBe("rolled_back");
  expect((await executeDataChangeSet(prepared, memory.database, "rollback", true)).status).toBe("already_rolled_back");
  expect([...memory.records.values()]).toEqual(initial);
  expect(memory.writes).toHaveLength(4);
  expect(memory.writes.every(write => Object.keys(write.patch as object).join() === "description")).toBe(true);
});

it.each(["missing", "identity", "context", "content", "mixed"])("preflights all targets and rejects %s before the first write", async problem =>
{
  const memory = memoryContentDatabase();
  const prepared = prepareDataChangeSet(approvedReview());
  const key = [...memory.records.keys()][1]!;
  const current = memory.records.get(key)!;
  if (problem === "missing") memory.records.delete(key);
  if (problem === "identity") current.grade = 2;
  if (problem === "context") current.tags = ["new-rule"];
  if (problem === "content") current.description = "Someone else's edit";
  if (problem === "mixed") current.description = prepared.rows[1]!.after.description;
  await expect(executeDataChangeSet(prepared, memory.database, "apply")).rejects.toThrow();
  expect(memory.writes).toEqual([]);
});

it("rolls back an earlier row when a later write fails", async () =>
{
  const memory = memoryContentDatabase();
  memory.failWrite(2);
  await expect(executeDataChangeSet(prepareDataChangeSet(approvedReview()), memory.database, "apply")).rejects.toThrow("Synthetic failure");
  expect([...memory.records.values()]).toEqual(reviewRecords());
  expect(memory.writes).toEqual([]);
});

it("checks live values again after a successful earlier plan", async () =>
{
  const memory = memoryContentDatabase();
  const prepared = prepareDataChangeSet(approvedReview());
  expect(await memory.database.transaction(store => inspectDataChangeSet(prepared, store, "apply"))).toBe("ready");
  memory.records.values().next().value!.description = "Newer edit";
  await expect(executeDataChangeSet(prepared, memory.database, "apply")).rejects.toThrow("Stale");
  expect(memory.writes).toEqual([]);
});

it("refuses rollback after a subsequent user edit and refuses to repeat a completed operation", async () =>
{
  const memory = memoryContentDatabase();
  const prepared = prepareDataChangeSet(approvedReview());
  await executeDataChangeSet(prepared, memory.database, "apply");
  memory.records.values().next().value!.description = "Newer edit";
  await expect(executeDataChangeSet(prepared, memory.database, "rollback")).rejects.toThrow("Stale");
  expect(memory.writes).toHaveLength(2);
  memory.records.clear();
  reviewRecords().forEach(record => memory.records.set(`Maneuver/${record.id}`, record));
  await expect(executeDataChangeSet(prepared, memory.database, "apply", true)).rejects.toThrow("completed operation");
  expect(memory.writes).toHaveLength(2);
});
