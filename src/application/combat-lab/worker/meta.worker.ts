/** Meta Web Worker: runs the round-robin and builds the meta report off-thread. */

import { computeMeta } from "@/domain/combat-lab/analysis/meta";
import { resolvePolicy } from "@/application/combat-lab/worker/policyResolver";
import type { MetaWorkerRequest, MetaWorkerResponse } from "@/application/combat-lab/worker/metaMessages";

const ctx = self as unknown as Worker;

ctx.addEventListener("message", (event: MessageEvent<MetaWorkerRequest>) =>
{
  const request = event.data;

  try
  {
    const report = computeMeta(
      request.entries.map(entry => ({ snapshot: entry.snapshot, policy: resolvePolicy(entry.policy) })),
      { count: request.count, seedStart: request.seedStart, maxRounds: request.maxRounds },
      (completed, total) => post({ type: "progress", completed, total }),
    );
    post({ type: "done", report });
  }
  catch (error)
  {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
});

function post(message: MetaWorkerResponse): void
{
  ctx.postMessage(message);
}
