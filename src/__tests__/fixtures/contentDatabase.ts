import type { ContentDatabase, ContentStore } from "@/application/data-quality/dataChangeService";
import { reviewRecords } from "./dataChangeSet";

/** Models transaction rollback only. Real MongoDB race acceptance is separate. */
export function memoryContentDatabase(initial = reviewRecords())
{
  const records = new Map(initial.map(record => [`Maneuver/${record.id}`, structuredClone(record)]));
  const writes: { key: string; patch: unknown }[] = [];
  let transactions = 0;
  let failAtWrite = 0;
  const database: ContentDatabase = {
    async transaction(work)
    {
      transactions++;
      const pending = structuredClone(records);
      const changes: typeof writes = [];
      const store: ContentStore = {
        async read(collection, id) { return structuredClone(pending.get(`${collection}/${id}`) ?? null); },
        async write(collection, id, patch)
        {
          if (failAtWrite === changes.length + 1) throw new Error("Synthetic failure");
          const key = `${collection}/${id}`;
          pending.set(key, { ...pending.get(key), ...structuredClone(patch) });
          changes.push({ key, patch });
        },
      };
      const result = await work(store);
      records.clear();
      pending.forEach((value, key) => records.set(key, value));
      writes.push(...changes);
      return result;
    },
  };
  return { records, writes, database, get transactions() { return transactions; }, failWrite(number: number) { failAtWrite = number; } };
}
