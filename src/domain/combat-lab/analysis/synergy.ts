/**
 * Synergy Analyzer: how much each element of a build contributes to winning,
 * by ablation — run the full build, then re-run with one element removed and
 * measure the drop in win rate against a fixed opponent. A large positive
 * contribution = the element is pulling its weight; near zero (or negative) =
 * a candidate to cut or rework.
 *
 * Ablates MANEUVERS, SPELLS and the active STANCE/STATE — everything the picker
 * lets you choose per run. Talents/buff profiles are baked into the snapshot's
 * stats, so ablating them would need the source character — future. Pairwise
 * synergy (two elements at once) is also future.
 *
 * Pure domain, built on `runSimulation`; deterministic.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { runSimulation } from "@/domain/combat-lab/simulation/runSimulation";

export type SynergyElement =
{
  id: string;
  name: string;
  /** Subject's win rate with this element removed. */
  withoutWinRate: number;
  /** baseline − withoutWinRate. Positive = the element helps. */
  contribution: number;
};

export type SynergyReport =
{
  baselineWinRate: number;
  elements: SynergyElement[];
  count: number;
};

export type SynergyOptions =
{
  count: number;
  seedStart?: number;
  subjectPolicy?: ActionPolicy;
  opponentPolicy?: ActionPolicy;
  maxRounds?: number;
};

/**
 * `onProgress(done, total)` fires after each run (total = maneuvers + 1 baseline).
 */
export function computeSynergy(
  subject: CombatantSnapshot,
  opponent: CombatantSnapshot,
  options: SynergyOptions,
  onProgress?: (done: number, total: number) => void,
): SynergyReport
{
  const modes = ([["stance", subject.stance], ["state", subject.state]] as const)
    .filter((entry): entry is readonly ["stance" | "state", NonNullable<CombatantSnapshot["stance"]>] => entry[1] !== undefined);

  const total = subject.maneuvers.length + subject.spells.length + modes.length + 1;
  let done = 0;

  const baselineWinRate = subjectWinRate(subject, opponent, options);
  done += 1;
  onProgress?.(done, total);

  const elements: SynergyElement[] = subject.maneuvers.map((maneuver, index) =>
  {
    const without: CombatantSnapshot = { ...subject, maneuvers: subject.maneuvers.filter((_, k) => k !== index) };
    const withoutWinRate = subjectWinRate(without, opponent, options);
    done += 1;
    onProgress?.(done, total);
    return { id: maneuver.id, name: maneuver.name, withoutWinRate, contribution: baselineWinRate - withoutWinRate };
  });

  // Ablate each spell the same way — a caster's spells are build elements too.
  for (let index = 0; index < subject.spells.length; index++)
  {
    const spell = subject.spells[index]!;
    const without: CombatantSnapshot = { ...subject, spells: subject.spells.filter((_, k) => k !== index) };
    const withoutWinRate = subjectWinRate(without, opponent, options);
    done += 1;
    onProgress?.(done, total);
    elements.push({ id: spell.id, name: spell.name, withoutWinRate, contribution: baselineWinRate - withoutWinRate });
  }

  // Ablate the stance and the state: they are picked per run exactly like the
  // rest of the build, and a stance that contributes nothing is worth knowing
  // about — the whole point of authoring their effects.
  for (const [slot, mode] of modes)
  {
    const without: CombatantSnapshot = { ...subject, [slot]: undefined };
    const withoutWinRate = subjectWinRate(without, opponent, options);
    done += 1;
    onProgress?.(done, total);
    elements.push({
      id: `${slot}:${mode.name}`,
      name: `${slot === "stance" ? "Postawa" : "Stan"}: ${mode.name} (r${mode.baseGrade})`,
      withoutWinRate,
      contribution: baselineWinRate - withoutWinRate,
    });
  }

  elements.sort((a, b) => b.contribution - a.contribution || a.name.localeCompare(b.name));
  return { baselineWinRate, elements, count: options.count };
}

function subjectWinRate(subject: CombatantSnapshot, opponent: CombatantSnapshot, options: SynergyOptions): number
{
  const { summary } = runSimulation({
    a: subject,
    b: opponent,
    count: options.count,
    seedStart: options.seedStart ?? 0,
    policyA: options.subjectPolicy,
    policyB: options.opponentPolicy,
    maxRounds: options.maxRounds,
  });
  return summary.winRates[subject.id] ?? 0;
}
