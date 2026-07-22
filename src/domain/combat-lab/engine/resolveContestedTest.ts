/**
 * Resolve a contested test (T2c): two opposed skill-pool rolls. Pure and
 * deterministic (injected rng). Confirmed mechanic (see contested-test plan §7):
 *   - stat contribution = value + bonus + testBonus (getStatisticTotalTestValue);
 *   - a summed pool rolls ONE die k(maxGrade×2) from the highest-rank chosen stat,
 *     plus the sum of all chosen stats' contributions, plus a flat modifier;
 *   - "/" alternatives pick the stat maximising (contribution + grade);
 *   - advantage/disadvantage roll the die twice, keep higher/lower;
 *   - margin = attacker − defender; win when margin > 0 (tie → defender).
 */

import type { Statistic } from "@/domain/characters/statistics/Statistic";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import { roll } from "@/domain/characters/combat/Offense";
import type { RandomSource } from "@/domain/combat-lab/rng/Rng";
import type { ContestedTestEffect, SaveTestEffect, PoolTerm, TestSide, SkillRef } from "@/domain/combat-lab/effects/Effect";
import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";

type Skills = CombatantSnapshot["skills"];

const ZERO: Statistic = { grade: 0, value: 0, bonus: 0, testBonus: 0 };

function statOf(skills: Skills, ref: SkillRef): Statistic
{
  const group = skills[ref.group] as unknown as Record<string, Statistic> | undefined;
  return (group && group[ref.key]) || ZERO;
}

/** Alternatives: pick the stat maximising (total test value + grade). */
function pickTerm(skills: Skills, term: PoolTerm): Statistic
{
  let best = ZERO;
  let bestScore = -Infinity;
  for (const ref of term.anyOf)
  {
    const stat = statOf(skills, ref);
    const score = getStatisticTotalTestValue(stat) + stat.grade;
    if (score > bestScore) { bestScore = score; best = stat; }
  }
  return best;
}

/** Roll a full test side (die from max chosen grade + summed contributions +
 * modifier, with optional advantage/disadvantage). Exported for save tests. */
export function rollTestSide(skills: Skills, side: TestSide, random: RandomSource): number
{
  return rollSide(skills, side, random);
}

function rollSide(skills: Skills, side: TestSide, random: RandomSource): number
{
  const chosen = side.pool.map(term => pickTerm(skills, term));
  const value = chosen.reduce((sum, s) => sum + getStatisticTotalTestValue(s), 0) + (side.modifier ?? 0);
  const maxGrade = chosen.reduce((g, s) => Math.max(g, s.grade), 1) + (side.dieGradeDelta ?? 0);
  const grade = Math.max(1, maxGrade);

  const first = roll(grade, random);
  let dieRoll = first;
  if (side.rollMod === "advantage" || side.rollMod === "disadvantage")
  {
    const second = roll(grade, random);
    dieRoll = side.rollMod === "advantage" ? Math.max(first, second) : Math.min(first, second);
  }

  return dieRoll + value;
}

export type ContestedResolution =
{
  attackerResult: number;
  defenderResult: number;
  margin: number;
  win: boolean;
};

/** Expected (mean) result of a side — deterministic pool value + mean die. Used
 * by the AI valuation to estimate win probability without rolling. */
export function expectedSideResult(skills: Skills, side: TestSide): number
{
  const chosen = side.pool.map(term => pickTerm(skills, term));
  const value = chosen.reduce((sum, s) => sum + getStatisticTotalTestValue(s), 0) + (side.modifier ?? 0);
  const grade = Math.max(1, chosen.reduce((g, s) => Math.max(g, s.grade), 1) + (side.dieGradeDelta ?? 0));
  return value + (grade * 2 + 1) / 2;
}

export function resolveContestedTest(
  attackerSkills: Skills,
  defenderSkills: Skills,
  effect: ContestedTestEffect,
  random: RandomSource,
): ContestedResolution
{
  const attackerResult = rollSide(attackerSkills, effect.attacker, random);
  const defenderResult = rollSide(defenderSkills, effect.defender, random);
  const margin = attackerResult - defenderResult;
  return { attackerResult, defenderResult, margin, win: margin > 0 };
}

export type SaveResolution = { roll: number; st: number; failMargin: number; failed: boolean };

/** Resolve a save vs a fixed ST. Fails when roll < st; failMargin = st − roll. */
export function resolveSaveTest(
  saverSkills: Skills,
  effect: SaveTestEffect,
  random: RandomSource,
): SaveResolution
{
  const roll = rollSide(saverSkills, effect.pool, random);
  const failMargin = Math.max(0, effect.st - roll);
  return { roll, st: effect.st, failMargin, failed: roll < effect.st };
}
