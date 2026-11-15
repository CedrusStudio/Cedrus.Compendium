import { DataChangeBlockedError, reviewSnapshot, type ContentCollection, type PreparedChangeSet, type PreparedRow } from "@/domain/data-quality/dataChangeSet";

export type ChangeDirection = "apply" | "rollback";
export interface ContentStore
{
  read(collection: ContentCollection, id: string): Promise<Record<string, unknown> | null>;
  write(collection: ContentCollection, id: string, patch: PreparedRow["patch"]): Promise<void>;
}
export interface ContentDatabase
{
  transaction<T>(work: (store: ContentStore) => Promise<T>): Promise<T>;
}
export type ChangeResult = { status: "applied" | "already_applied" | "rolled_back" | "already_rolled_back"; rows: { reviewId: string; beforeHash: string; afterHash: string }[] };

/** Check every target before the first write. Mixed states are a conflict,
 * never an instruction to finish an apparently partial old batch silently.
 */
export async function inspectDataChangeSet(prepared: PreparedChangeSet, store: ContentStore, direction: ChangeDirection)
{
  const issues: string[] = [];
  const states: ("source" | "target")[] = [];
  for (const row of prepared.rows)
  {
    const record = await store.read(row.collection, row.id);
    if (!record)
    {
      issues.push(`${row.reviewId}: Unknown ID.`);
      continue;
    }
    const current = reviewSnapshot(record);
    const source = direction === "apply" ? row.expectedHash : row.afterHash;
    const target = direction === "apply" ? row.afterHash : row.expectedHash;
    if (record.name !== row.identityAssertions.name || record.grade !== row.identityAssertions.grade) issues.push(`${row.reviewId}: Identity assertion failed.`);
    if (current.hash === source) states.push("source");
    else if (current.hash === target) states.push("target");
    else issues.push(`${row.reviewId}: Stale content or changed rule context.`);
  }
  if (states.includes("source") && states.includes("target")) issues.push("Mixed before/after state; review the entire batch.");
  if (issues.length > 0) throw new DataChangeBlockedError(issues);
  return states.every(state => state === "target") ? "already" : "ready";
}

export async function executeDataChangeSet(prepared: PreparedChangeSet, database: ContentDatabase, direction: ChangeDirection, previouslyCompleted = false): Promise<ChangeResult>
{
  return database.transaction(async store =>
  {
    const state = await inspectDataChangeSet(prepared, store, direction);
    if (previouslyCompleted && state !== "already") throw new DataChangeBlockedError(["A completed operation no longer matches its recorded result; refusing to repeat it."]);
    if (state === "ready")
    {
      for (const row of prepared.rows)
      {
        const patch = direction === "apply" ? row.patch : Object.fromEntries(
          Object.keys(row.patch).map(key => [key, row.before[key as keyof typeof row.before]]),
        );
        await store.write(row.collection, row.id, patch);
      }
      // Verify the stored representation while failure can still abort every
      // write. MongoDB aborts conflicting writes to these documents as well.
      if (await inspectDataChangeSet(prepared, store, direction) !== "already") throw new DataChangeBlockedError(["Stored result did not match the approved after values."]);
    }
    return {
      status: direction === "apply" ? state === "already" ? "already_applied" : "applied" : state === "already" ? "already_rolled_back" : "rolled_back",
      rows: prepared.rows.map(row => ({ reviewId: row.reviewId, beforeHash: row.expectedHash, afterHash: row.afterHash })),
    };
  });
}
