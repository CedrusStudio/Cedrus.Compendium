/**
 * The deterministic combat loop — the heart of Combat Lab. Given two snapshots,
 * a seed and per-combatant policies, it plays out a full fight and returns a
 * serializable `CombatLog`. Same inputs → identical log, always.
 *
 * Currently 1v1 (the doc's primary case, e.g. Knight vs Orc); the structure
 * generalizes to Nv N by extending target selection.
 *
 * DEATH MODEL (Etap 1, documented default — confirm against rulebook):
 *   - A combatant at hp ≤ 0 is "downed".
 *   - Downed dies immediately if hp ≤ -lethalHealth, or if `lethalRounds` ≤ 0,
 *     otherwise it bleeds out after `lethalRounds` rounds spent downed.
 *   - A downed combatant cannot act.
 */

import type { CombatantSnapshot } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { CombatLog, CombatEndReason } from "@/domain/combat-lab/engine/CombatLog";
import { CombatLogBuilder } from "@/domain/combat-lab/engine/CombatLog";
import type { CombatState, CombatantRuntime } from "@/domain/combat-lab/engine/CombatState";
import { createRuntime, canAct } from "@/domain/combat-lab/engine/CombatState";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import { resolveAttack } from "@/domain/combat-lab/engine/resolveAttack";
import { dealDamage, reduceDamage, defaultDamageResolution, type DamageResolutionConfig } from "@/domain/combat-lab/engine/damage";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { availableActions, recordAction, endTurnLedger, type Action } from "@/domain/combat-lab/engine/actionEconomy";
import { basicAttackPolicy, greedyDamagePolicy, type ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { rollDamageSpec } from "@/domain/combat-lab/engine/rollOffense";
import { selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";
import type { DamageType } from "@/domain/combat-lab/effects/Effect";

export type CombatOptions =
{
  seed: number;
  policyA?: ActionPolicy;
  policyB?: ActionPolicy;
  /** Hard cap on rounds; reaching it ends the fight as "timeout". Default 100. */
  maxRounds?: number;
  /** Safety cap on actions per turn (defensive; profiles usually cap first). */
  maxActionsPerTurn?: number;
  config?: DamageResolutionConfig;
};

export function runCombat(
  snapshotA: CombatantSnapshot,
  snapshotB: CombatantSnapshot,
  options: CombatOptions,
): CombatLog
{
  const maxRounds = options.maxRounds ?? 100;
  const maxActionsPerTurn = options.maxActionsPerTurn ?? 12;
  const config = options.config ?? defaultDamageResolution;
  const rng = createRng(options.seed);
  const random = rng.next;
  const log = new CombatLogBuilder(options.seed);

  const runtimeA = createRuntime(snapshotA);
  const runtimeB = createRuntime(snapshotB);
  const policies = new Map<string, ActionPolicy>([
    [runtimeA.snapshot.id, options.policyA ?? greedyDamagePolicy],
    [runtimeB.snapshot.id, options.policyB ?? basicAttackPolicy],
  ]);

  const state: CombatState = { combatants: [runtimeA, runtimeB], round: 0 };

  log.push({
    kind: "combatStart",
    seed: options.seed,
    combatants: state.combatants.map(c => ({ id: c.snapshot.id, name: c.snapshot.name, maxHp: c.snapshot.maxHp })),
  });

  rollInitiative(state, rng.nextIntInclusive.bind(rng));
  const order = [...state.combatants].sort(byInitiative);
  log.push({ kind: "initiative", order: order.map(c => ({ id: c.snapshot.id, roll: c.initiativeRoll })) });

  let endReason: CombatEndReason = "timeout";

  outer: for (let round = 1; round <= maxRounds; round++)
  {
    state.round = round;
    log.push({ kind: "roundStart", round });

    for (const actor of order)
    {
      if (!actor.alive) continue;

      log.push({ kind: "turnStart", round, actorId: actor.snapshot.id });

      tickStatuses(actor, random, log, config);
      tickControls(actor);
      applyDownedProgress(actor);

      if (actor.alive && canAct(actor) && actor.currentHp > 0)
      {
        const opponent = firstLivingOpponent(state, actor);
        if (opponent)
        {
          takeTurn(actor, opponent, policies.get(actor.snapshot.id)!, random, log, config, maxActionsPerTurn);
        }
      }
      else if (actor.alive)
      {
        log.push({ kind: "pass", actorId: actor.snapshot.id, reason: actor.currentHp <= 0 ? "downed" : "controlled" });
      }

      endTurnLedger(actor);
      log.push({ kind: "turnEnd", round, actorId: actor.snapshot.id });

      const living = state.combatants.filter(c => c.alive);
      if (living.length <= 1)
      {
        endReason = living.length === 1 ? "knockout" : "draw";
        break outer;
      }
    }
  }

  const { winnerId, reason } = decideOutcome(state, endReason);
  log.push({ kind: "combatEnd", reason, winnerId, rounds: state.round });

  return log.build();
}

function rollInitiative(state: CombatState, rollInclusive: (min: number, max: number) => number): void
{
  for (const combatant of state.combatants)
  {
    const stat = combatant.snapshot.initiative;
    const die = rollInclusive(1, Math.max(1, stat.grade * 2));
    combatant.initiativeRoll = die + getStatisticTotalTestValue(stat);
  }
}

function byInitiative(a: CombatantRuntime, b: CombatantRuntime): number
{
  if (b.initiativeRoll !== a.initiativeRoll) return b.initiativeRoll - a.initiativeRoll;
  // Deterministic tie-break by id so ordering is stable and reproducible.
  return a.snapshot.id < b.snapshot.id ? -1 : 1;
}

function firstLivingOpponent(state: CombatState, self: CombatantRuntime): CombatantRuntime | undefined
{
  return state.combatants.find(c => c.alive && c.snapshot.id !== self.snapshot.id);
}

function takeTurn(
  actor: CombatantRuntime,
  opponent: CombatantRuntime,
  policy: ActionPolicy,
  random: () => number,
  log: CombatLogBuilder,
  config: DamageResolutionConfig,
  maxActionsPerTurn: number,
): void
{
  for (let i = 0; i < maxActionsPerTurn; i++)
  {
    const available = availableActions(actor);
    if (available.length === 0) break;

    const action = policy.chooseAction(actor, opponent, available);
    if (action.kind === "pass") break;

    executeAction(actor, opponent, action, random, log, config);
    recordAction(actor, action);

    checkDeath(opponent, log);
    if (!opponent.alive) break;
  }
}

function executeAction(
  actor: CombatantRuntime,
  opponent: CombatantRuntime,
  action: Action,
  random: () => number,
  log: CombatLogBuilder,
  config: DamageResolutionConfig,
): void
{
  if (action.kind === "attack")
  {
    const result = resolveAttack(actor.snapshot, opponent.snapshot, random, config);
    const remainingHp = dealDamage(opponent, result.dealt);
    log.push({
      kind: "attack",
      actorId: actor.snapshot.id,
      targetId: opponent.snapshot.id,
      raw: result.raw,
      reduced: result.reduced,
      dealt: result.dealt,
      critical: result.critical,
      remainingHp,
    });
  }
  else if (action.kind === "maneuver")
  {
    log.push({
      kind: "maneuver",
      actorId: actor.snapshot.id,
      targetId: opponent.snapshot.id,
      maneuverId: action.maneuver.id,
      maneuverName: action.maneuver.name,
    });
    applyEffects(action.maneuver.effects, actor, opponent, { random, log, config });
  }
}

function tickStatuses(
  runtime: CombatantRuntime,
  random: () => number,
  log: CombatLogBuilder,
  config: DamageResolutionConfig,
): void
{
  const survivors: typeof runtime.statuses = [];

  for (const status of runtime.statuses)
  {
    if (status.tick)
    {
      const perStack = rollDamageSpec(status.tick.damage, random);
      const amount = perStack * status.stacks;
      const remainingHp = dealDamage(runtime, reduceTick(amount, status.tick.damageType, config, runtime));
      log.push({ kind: "statusTick", targetId: runtime.snapshot.id, status: status.status, amount, remainingHp });
    }

    status.remaining -= 1;
    if (status.remaining > 0)
    {
      survivors.push(status);
    }
    else
    {
      log.push({ kind: "statusExpired", targetId: runtime.snapshot.id, status: status.status });
    }
  }

  runtime.statuses = survivors;
  checkDeath(runtime, log);
}

function tickControls(runtime: CombatantRuntime): void
{
  runtime.controls = runtime.controls
    .map(c => ({ ...c, remaining: c.remaining - 1 }))
    .filter(c => c.remaining > 0);
}

function applyDownedProgress(runtime: CombatantRuntime): void
{
  if (runtime.alive && runtime.currentHp <= 0)
  {
    runtime.roundsDowned += 1;
  }
}

function checkDeath(runtime: CombatantRuntime, log: CombatLogBuilder): void
{
  if (!runtime.alive) return;
  if (isDead(runtime))
  {
    runtime.alive = false;
  }
  // (No dedicated death event; `combatEnd` carries the winner. Kept for future.)
  void log;
}

function isDead(runtime: CombatantRuntime): boolean
{
  if (runtime.currentHp > 0) return false;
  const buffer = Math.max(0, runtime.snapshot.lethalHealth);
  if (runtime.currentHp <= -buffer) return true;
  if (runtime.snapshot.lethalRounds <= 0) return true;
  return runtime.roundsDowned >= runtime.snapshot.lethalRounds;
}

function decideOutcome(state: CombatState, fallbackReason: CombatEndReason): { winnerId: string | null; reason: CombatEndReason }
{
  const living = state.combatants.filter(c => c.alive);

  if (living.length === 1) return { winnerId: living[0]!.snapshot.id, reason: "knockout" };
  if (living.length === 0) return { winnerId: null, reason: "draw" };

  // Timeout: winner is whoever has the higher remaining hp (null on a tie).
  const [a, b] = state.combatants;
  if (a!.currentHp === b!.currentHp) return { winnerId: null, reason: fallbackReason };
  return { winnerId: a!.currentHp > b!.currentHp ? a!.snapshot.id : b!.snapshot.id, reason: fallbackReason };
}

function reduceTick(amount: number, damageType: DamageType, config: DamageResolutionConfig, runtime: CombatantRuntime): number
{
  const ignoresDefense = damageType === "true";
  // DoT typically bypasses block/parry/dodge; treat as direct-ish by ignoring
  // the flat guard layers but still respecting immunity/resistance.
  return reduceDamage(amount, selectDefaultDefense(runtime.snapshot), config, ignoresDefense);
}
