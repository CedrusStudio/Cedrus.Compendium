import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const testUrl = vi.hoisted(() =>
{
  const value = process.env.DATA_CHANGE_TEST_DATABASE_URL;
  if (value)
  {
    const url = new URL(value);
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.startsWith("/cedrus_data_change_test")) throw new Error("Use a dedicated local cedrus_data_change_test database.");
    process.env.DATABASE_CONNECTION_STRING = value;
  }
  return value;
});

import prisma from "@/lib/prisma";
import { prismaContentDatabase } from "../prismaContentDatabase";
import { approvedReview } from "@/__tests__/fixtures/dataChangeSet";
import { prepareDataChangeSet } from "@/domain/data-quality/dataChangeSet";
import { executeDataChangeSet, type ContentDatabase } from "@/application/data-quality/dataChangeService";

describe.skipIf(!testUrl)("data changes against a real local MongoDB replica set", () =>
{
  const ids: string[] = [];
  beforeAll(async () => { await prisma.$connect(); });
  afterAll(async () => { await prisma.maneuver.deleteMany({ where: { id: { in: ids } } }); await prisma.$disconnect(); });
  async function fixture()
  {
    const records = [];
    for (let index = 0; index < 2; index++)
    {
      const id = "0" + randomUUID().replaceAll("-", "").slice(0, 25).toUpperCase(); ids.push(id);
      records.push(await prisma.maneuver.create({ data: { id, name: `data-change-test-${id}`, grade: 1, description: `Original ${index}`, price: 1, tags: [], characterIds: [], castTime: "Standardowa", cooldown: 0 } }));
    }
    return { records, prepared: prepareDataChangeSet(approvedReview(records)), database: prismaContentDatabase(prisma) };
  }

  it("commits once, supports retries and restores nullable effect values", async () =>
  {
    const { records, prepared, database } = await fixture();
    const batch = prepared.batch;
    batch.rows[0]!.changeKind = "mapping";
    batch.rows[0]!.proposed = { effects: [{ type: "stat", mode: "self", duration: 1, resistance: 2 }], simulatable: true, unsupportedReason: null };
    batch.rows[0]!.verification.checks.push({ name: "synthetic engine", kind: "engine", result: "PASS", evidence: "test fixture" });
    const mapping = prepareDataChangeSet(batch);
    expect((await executeDataChangeSet(mapping, database, "apply")).status).toBe("applied");
    expect((await executeDataChangeSet(mapping, database, "apply", true)).status).toBe("already_applied");
    expect((await executeDataChangeSet(mapping, database, "rollback")).status).toBe("rolled_back");
    expect(await prisma.maneuver.findUnique({ where: { id: records[0]!.id } })).toEqual(records[0]);
  });

  it("rolls back the first write when a later row fails", async () =>
  {
    const { records, prepared, database } = await fixture();
    const failing: ContentDatabase = { transaction: work => database.transaction(store => work({ ...store, write: async (collection, id, patch) =>
    {
      if (id === records[1]!.id) throw new Error("Synthetic later failure");
      await store.write(collection, id, patch);
    } })) };
    await expect(executeDataChangeSet(prepared, failing, "apply")).rejects.toThrow("Synthetic later failure");
    expect(await prisma.maneuver.findUnique({ where: { id: records[0]!.id } })).toEqual(records[0]);
  });

  it("aborts a write after an external edit between transaction read and write", async () =>
  {
    const { records, prepared, database } = await fixture();
    let edited = false;
    const racing: ContentDatabase = { transaction: work => database.transaction(store => work({ ...store, write: async (collection, id, patch) =>
    {
      if (!edited)
      {
        edited = true;
        await prisma.maneuver.update({ where: { id }, data: { description: "Concurrent owner edit" } });
      }
      await store.write(collection, id, patch);
    } })) };
    await expect(executeDataChangeSet(prepared, racing, "apply")).rejects.toMatchObject({ code: "P2034" });
    expect((await prisma.maneuver.findUniqueOrThrow({ where: { id: records[0]!.id } })).description).toBe("Concurrent owner edit");
    expect(await prisma.maneuver.findUnique({ where: { id: records[1]!.id } })).toEqual(records[1]);
  });
});
