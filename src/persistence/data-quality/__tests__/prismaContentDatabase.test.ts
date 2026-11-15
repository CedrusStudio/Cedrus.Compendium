import { Prisma, type PrismaClient } from "@prisma/client";
import { expect, it, vi } from "vitest";
import { prismaContentDatabase } from "../prismaContentDatabase";

it("keeps reads/writes on the same transaction client and translates nullable JSON restores", async () =>
{
  const delegate = () => ({ findUnique: vi.fn(async () => ({ id: "synthetic" })), update: vi.fn(async () => ({})) });
  const tx = { maneuver: delegate(), stance: delegate(), state: delegate() };
  const transaction = vi.fn(async (work: (client: typeof tx) => Promise<unknown>, _options: { timeout: number }) => work(tx));
  const database = prismaContentDatabase({ $transaction: transaction } as unknown as PrismaClient);
  await database.transaction(async store =>
  {
    for (const collection of ["Maneuver", "Stance", "State"] as const)
    {
      await store.read(collection, "synthetic");
      await store.write(collection, "synthetic", { effects: null, simulatable: null, unsupportedReason: null });
      await store.write(collection, "synthetic", { description: "Editorial" });
    }
  });
  expect(transaction).toHaveBeenCalledOnce();
  expect(transaction.mock.calls[0][1]).toEqual({ timeout: 10_000 });
  for (const model of Object.values(tx))
  {
    expect(model.findUnique).toHaveBeenCalledWith({ where: { id: "synthetic" } });
    expect(model.update).toHaveBeenNthCalledWith(1, { where: { id: "synthetic" }, data: { effects: Prisma.DbNull, simulatable: null, unsupportedReason: null } });
    expect(model.update).toHaveBeenNthCalledWith(2, { where: { id: "synthetic" }, data: { description: "Editorial" } });
  }
});

it("propagates a transaction write conflict without automatic retries", async () =>
{
  const failure = { code: "P2034" };
  const transaction = vi.fn().mockRejectedValue(failure);
  const database = prismaContentDatabase({ $transaction: transaction } as unknown as PrismaClient);
  await expect(database.transaction(async () => undefined)).rejects.toBe(failure);
  expect(transaction).toHaveBeenCalledOnce();
});
