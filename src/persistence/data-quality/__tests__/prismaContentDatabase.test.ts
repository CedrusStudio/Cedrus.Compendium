import type { PrismaClient } from "@prisma/client";
import { expect, it, vi } from "vitest";
import { prismaContentDatabase } from "../prismaContentDatabase";

it("keeps transaction routing and preserves MongoDB null, empty effects and omitted effects", async () =>
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
      await store.write(collection, "synthetic", { effects: [], simulatable: false, unsupportedReason: "Unsupported" });
    }
  });
  expect(transaction).toHaveBeenCalledOnce();
  expect(transaction.mock.calls[0][1]).toEqual({ timeout: 10_000 });
  for (const model of Object.values(tx))
  {
    expect(model.findUnique).toHaveBeenCalledWith({ where: { id: "synthetic" } });
    expect(model.update).toHaveBeenNthCalledWith(1, { where: { id: "synthetic" }, data: { effects: null, simulatable: null, unsupportedReason: null } });
    expect(model.update).toHaveBeenNthCalledWith(2, { where: { id: "synthetic" }, data: { description: "Editorial" } });
    expect(model.update).toHaveBeenNthCalledWith(3, { where: { id: "synthetic" }, data: { effects: [], simulatable: false, unsupportedReason: "Unsupported" } });
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
