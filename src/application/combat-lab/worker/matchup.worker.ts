/**
 * Matchup Web Worker: computes the N×N win-rate matrix off the main thread,
 * posting progress per pair.
 */

import { computeMatchupMatrix } from "@/domain/combat-lab/analysis/matchup";
import { resolvePolicy } from "@/application/combat-lab/worker/policyResolver";
import type { MatchupWorkerRequest, MatchupWorkerResponse } from "@/application/combat-lab/worker/matchupMessages";

const ctx = self as unknown as Worker;

ctx.addEventListener("message", (event: MessageEvent<MatchupWorkerRequest>) =>
{
  const request = event.data;

  try
  {
    const matrix = computeMatchupMatrix(
      request.entries.map(entry => ({ snapshot: entry.snapshot, policy: resolvePolicy(entry.policy) })),
      { count: request.count, seedStart: request.seedStart, maxRounds: request.maxRounds },
      (completed, total) => post({ type: "progress", completed, total }),
    );
    post({ type: "done", matrix });
  }
  catch (error)
  {
    post({ type: "error", message: error instanceof Error ? error.message : String(error) });
  }
});

function post(message: MatchupWorkerResponse): void
{
  ctx.postMessage(message);
}
