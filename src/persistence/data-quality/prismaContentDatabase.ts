import { Prisma, type PrismaClient } from "@prisma/client";
import type { ContentDatabase, ContentStore } from "@/application/data-quality/dataChangeService";

/** Prisma 6 MongoDB interactive transactions guard the reads and writes together.
 * Never retry a write conflict internally: the operator must see a fresh plan.
 */
export function prismaContentDatabase(prisma: PrismaClient): ContentDatabase
{
  return {
    transaction: work => prisma.$transaction(async tx =>
    {
      const store: ContentStore = {
        async read(collection, id)
        {
          if (collection === "Maneuver") return tx.maneuver.findUnique({ where: { id } });
          if (collection === "Stance") return tx.stance.findUnique({ where: { id } });
          return tx.state.findUnique({ where: { id } });
        },
        async write(collection, id, patch)
        {
          const data = { ...patch, ...(patch.effects === null ? { effects: Prisma.DbNull } : {}) } as Prisma.StanceUpdateInput;
          if (collection === "Maneuver") { await tx.maneuver.update({ where: { id }, data }); return; }
          if (collection === "Stance") { await tx.stance.update({ where: { id }, data }); return; }
          await tx.state.update({ where: { id }, data });
        },
      };
      return work(store);
    }, { timeout: 10_000 }),
  };
}
