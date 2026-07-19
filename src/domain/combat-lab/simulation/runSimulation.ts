/**
 * Simulation Engine: run many deterministic fights over a contiguous seed range
 * and collect their results. Pure — no I/O, no workers — so it can run on the
 * main thread, in a Web Worker, or on the server unchanged.
 *
 * Each fight uses `seedStart + i` as its seed, so a run is fully reproducible
 * and trivially splittable across workers (each takes a sub-range).
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { DamageResolutionConfig } from "@/domain/combat-lab/engine/damage";
import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { runCombat } from "@/domain/combat-lab/engine/runCombat";
import type { RawResult, SimulationSummary } from "@/domain/combat-lab/simulation/RawResult";
import { summarizeCombat } from "@/domain/combat-lab/simulation/summarizeCombat";
import { aggregateResults } from "@/domain/combat-lab/simulation/aggregateResults";

export type SimulationRequest =
{
  a: CombatantSnapshot;
  b: CombatantSnapshot;
  count: number;
  seedStart?: number;
  policyA?: ActionPolicy;
  policyB?: ActionPolicy;
  maxRounds?: number;
  config?: DamageResolutionConfig;
};

export type SimulationRun =
{
  results: RawResult[];
  summary: SimulationSummary;
};

/**
 * Run `count` fights and return raw results plus an aggregated summary.
 *
 * `onProgress` (if given) is called every `progressInterval` fights with the
 * number completed so far — used to drive a progress bar from a worker.
 */
export function runSimulation(
  request: SimulationRequest,
  onProgress?: (completed: number, total: number) => void,
  progressInterval = 500,
): SimulationRun
{
  const results = runSimulationChunk(request);

  if (onProgress)
  {
    for (let done = progressInterval; done < results.length; done += progressInterval)
    {
      onProgress(done, request.count);
    }
    onProgress(results.length, request.count);
  }

  return { results, summary: aggregateResults(results) };
}

/**
 * Run just the fights for a seed sub-range and return their raw results (no
 * aggregation). This is the unit a worker computes; the caller merges chunks
 * and aggregates once.
 */
export function runSimulationChunk(request: SimulationRequest): RawResult[]
{
  const seedStart = request.seedStart ?? 0;
  const results: RawResult[] = new Array(request.count);

  for (let i = 0; i < request.count; i++)
  {
    const log = runCombat(request.a, request.b, {
      seed: seedStart + i,
      policyA: request.policyA,
      policyB: request.policyB,
      maxRounds: request.maxRounds,
      config: request.config,
    });
    results[i] = summarizeCombat(log);
  }

  return results;
}

/** Split a run into `chunks` contiguous seed sub-ranges for parallel execution. */
export function splitSeedRange(
  seedStart: number,
  count: number,
  chunks: number,
): { seedStart: number; count: number }[]
{
  const safeChunks = Math.max(1, Math.min(chunks, count));
  const base = Math.floor(count / safeChunks);
  const remainder = count % safeChunks;

  const ranges: { seedStart: number; count: number }[] = [];
  let cursor = seedStart;

  for (let i = 0; i < safeChunks; i++)
  {
    const size = base + (i < remainder ? 1 : 0);
    if (size === 0) continue;
    ranges.push({ seedStart: cursor, count: size });
    cursor += size;
  }

  return ranges;
}
