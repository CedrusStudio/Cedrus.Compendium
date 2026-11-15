import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { DataChangeInputError, contentHash, contentCollections, reviewSnapshot, type PreparedChangeSet } from "@/domain/data-quality/dataChangeSet";
import type { ChangeDirection, ContentStore } from "@/application/data-quality/dataChangeService";
import type { BackupEvidence } from "./fileChangeJournal";

const manifestSchema = z.strictObject({
  createdAt: z.iso.datetime(), totalDocuments: z.number().int().min(0),
  collections: z.array(z.strictObject({ model: z.string().regex(/^[A-Za-z][A-Za-z0-9]*$/), count: z.number().int().min(0) })).min(1),
});

/** Uses only compendium records; private collections are verified by count and
 * discarded. Nothing from them is included in the returned store or journal.
 */
export function readReviewBackup(directory: string)
{
  const rawManifest = readFileSync(resolve(directory, "_manifest.json"), "utf8");
  const manifest = manifestSchema.parse(JSON.parse(rawManifest));
  const models = manifest.collections.map(item => item.model);
  const requiredModels = Prisma.dmmf.datamodel.models.map(model => model.name);
  if (new Set(models).size !== models.length || requiredModels.some(model => !models.includes(model))) throw new DataChangeInputError("Backup manifest has missing or duplicate application collections.");
  const collectionHashes: Record<string, string> = {};
  const collections = new Map<string, Record<string, unknown>[]>();
  let count = 0;
  for (const entry of manifest.collections)
  {
    const bytes = readFileSync(resolve(directory, `${entry.model}.json`));
    const records: unknown = JSON.parse(bytes.toString("utf8"));
    if (!Array.isArray(records) || records.length !== entry.count) throw new DataChangeInputError(`Backup count mismatch: ${entry.model}.`);
    count += records.length;
    collectionHashes[entry.model] = createHash("sha256").update(bytes).digest("hex");
    if (contentCollections.includes(entry.model as typeof contentCollections[number])) collections.set(entry.model, records);
  }
  if (count !== manifest.totalDocuments) throw new DataChangeInputError("Backup manifest total mismatch.");
  const evidence: BackupEvidence = { createdAt: manifest.createdAt, manifestHash: contentHash(manifest), collectionHashes };
  const store: ContentStore = {
    async read(collection, id)
    {
      const matches = collections.get(collection)?.filter(record => record.id === id) ?? [];
      if (matches.length > 1) throw new DataChangeInputError("Duplicate immutable ID in backup.");
      return matches[0] ?? null;
    },
    async write() { throw new DataChangeInputError("Offline backup stores are read-only."); },
  };
  return { evidence, store, collections };
}

export async function requireWriteBackup(backup: ReturnType<typeof readReviewBackup>, prepared: PreparedChangeSet, direction: ChangeDirection): Promise<void>
{
  for (const row of prepared.rows)
  {
    const record = await backup.store.read(row.collection, row.id);
    const expected = direction === "apply" ? row.expectedHash : row.afterHash;
    if (!record || reviewSnapshot(record).hash !== expected) throw new DataChangeInputError(`${row.reviewId}: Backup does not contain the required ${direction === "apply" ? "before" : "after"} values.`);
  }
  if (Date.parse(backup.evidence.createdAt) < Date.parse(prepared.batch.source.exportCreatedAt)) throw new DataChangeInputError("Write backup predates the reviewed source export.");
}
