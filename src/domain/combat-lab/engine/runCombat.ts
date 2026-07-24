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
import { createRuntime, canAct, isStaggered, activeBuffProfiles } from "@/domain/combat-lab/engine/CombatState";
import { createRng } from "@/domain/combat-lab/rng/Rng";
import { getStatisticTotalTestValue } from "@/domain/characters/statistics/Statistic";
import { resolveAttack } from "@/domain/combat-lab/engine/resolveAttack";
import { resolveRangedAttack, rangedCategory, DISTANCE_ST } from "@/domain/combat-lab/engine/resolveRangedAttack";
import { dealDamage, reduceDamage, bypassesBarrier, applyDamageMultipliers } from "@/domain/combat-lab/engine/damage";
import { applyEffects } from "@/domain/combat-lab/engine/applyEffect";
import { variantEffectsAt } from "@/domain/combat-lab/effects/ModeDefinition";
import { availableProactiveManeuvers, availableReactiveManeuvers, availableSpells, tickSpellCooldowns, recordAction, endTurnLedger, type Action } from "@/domain/combat-lab/engine/actionEconomy";
import { basicAttackPolicy, greedyDamagePolicy, type ActionPolicy } from "@/domain/combat-lab/engine/ai/policy";
import { rollDamageSpec } from "@/domain/combat-lab/engine/rollOffense";
import { selectDefaultDefense } from "@/domain/combat-lab/engine/CombatantSnapshot";

export type CombatOptions =
{
  seed: number;
  policyA?: ActionPolicy;
  policyB?: ActionPolicy;
  /** Hard cap on rounds; reaching it ends the fight as "timeout". Default 100. */
  maxRounds?: number;
  /** Safety cap on actions per turn (defensive; profiles usually cap first). */
  maxActionsPerTurn?: number;
  /** Shooting-distance ST for ranged attacks (rulebook table). Default: Normalny (5). */
  distanceST?: number;
};

export function runCombat(
  snapshotA: CombatantSnapshot,
  snapshotB: CombatantSnapshot,
  options: CombatOptions,
): CombatLog
{
  const maxRounds = options.maxRounds ?? 100;
  const maxActionsPerTurn = options.maxActionsPerTurn ?? 12;
  const distanceST = options.distanceST ?? DISTANCE_ST.normalny;
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

      tickStatuses(actor, random, log);
      tickControls(actor);
      tickBuffs(actor);
      tickMultipliers(actor);
      tickSpellCooldowns(actor);
      tickRankBonus(actor);
      if (actor.critSuppressedRemaining > 0) actor.critSuppressedRemaining -= 1;
      applyDownedProgress(actor);

      // Auto-cast the active stance/state: their effects re-apply at the start of
      // each turn so passive bonuses stay up and conditional/tick effects fire.
      {
        const modeOpponent = firstLivingOpponent(state, actor);
        if (modeOpponent && actor.alive) autoCastModes(actor, modeOpponent, random, log);
      }

      if (actor.alive && canAct(actor) && actor.currentHp > 0)
      {
        const opponent = firstLivingOpponent(state, actor);
        if (opponent)
        {
          takeTurn(actor, opponent, policies, random, log, maxActionsPerTurn, distanceST);
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
  policies: Map<string, ActionPolicy>,
  random: () => number,
  log: CombatLogBuilder,
  maxActionsPerTurn: number,
  distanceST: number,
): void
{
  const policy = policies.get(actor.snapshot.id)!;

  // Phase 1 — proactive maneuvers FIRST (a maneuver may buff / add damage before
  // the attack). The policy is offered the available maneuvers plus a "pass" so
  // it can decline; instant maneuvers are held back for reactions.
  for (let i = 0; i < maxActionsPerTurn; i++)
  {
    const maneuvers = availableProactiveManeuvers(actor);
    if (maneuvers.length === 0) break;

    const action = policy.chooseAction(actor, opponent, [{ kind: "pass" }, ...maneuvers]);
    if (action.kind !== "maneuver") break;

    executeAction(actor, opponent, action, policies, random, log, distanceST);
    recordAction(actor, action);

    checkDeath(opponent, log);
    if (!opponent.alive) return;
  }

  // Phase 2 — the attack (independent action), once per turn, AFTER maneuvers.
  // A castable spell may be used INSTEAD of the attack (occupies the same action);
  // the policy chooses between the basic attack and any affordable spell.
  if (!actor.attackedThisTurn)
  {
    const attack: Action = actor.snapshot.attackKind === "melee" ? { kind: "attack" } : { kind: "ranged" };
    const spells = availableSpells(actor);
    let chosen: Action = attack;
    if (spells.length > 0)
    {
      const pick = policy.chooseAction(actor, opponent, [attack, ...spells]);
      chosen = pick.kind === "spell" || pick.kind === "attack" || pick.kind === "ranged" ? pick : attack;
    }
    executeAction(actor, opponent, chosen, policies, random, log, distanceST);
    recordAction(actor, chosen);
    checkDeath(opponent, log);
  }
}

function executeAction(
  actor: CombatantRuntime,
  opponent: CombatantRuntime,
  action: Action,
  policies: Map<string, ActionPolicy>,
  random: () => number,
  log: CombatLogBuilder,
  distanceST: number,
): void
{
  if (action.kind === "attack")
  {
    // The defender may respond with an instant maneuver BEFORE the attack lands
    // (e.g. a defensive self-buff that reduces the incoming damage).
    reactToAttack(opponent, actor, policies, random, log);

    const result = resolveAttack(actor.snapshot, opponent.snapshot, random, {
      attackerStaggered: isStaggered(actor),
      defenderStaggered: isStaggered(opponent),
      attackerBuffs: activeBuffProfiles(actor),
      defenderBuffs: activeBuffProfiles(opponent),
      rollMods: actor.rollMods,
      suppressCrit: actor.critSuppressedRemaining > 0,
    });
    actor.rollMods = []; // consumed by this attack
    const dealt = applyDamageMultipliers(result.dealt, attackMultipliers(actor, opponent));
    actor.lastAttack = { critical: result.critical, dealt };
    const remainingHp = dealDamage(opponent, dealt);
    log.push({
      kind: "attack",
      actorId: actor.snapshot.id,
      targetId: opponent.snapshot.id,
      raw: result.raw,
      reduced: result.raw - dealt,
      dealt,
      critical: result.critical,
      remainingHp,
      resistance: result.breakdown.resistance,
      reduction: result.breakdown.reduction,
      immunityDice: result.breakdown.immunityDice,
    });
  }
  else if (action.kind === "ranged")
  {
    reactToAttack(opponent, actor, policies, random, log);

    const kind = actor.snapshot.attackKind === "rangedMagic" ? "rangedMagic" : "rangedPhysical";
    const result = resolveRangedAttack(actor.snapshot, opponent.snapshot, random, {
      distanceST,
      category: rangedCategory(kind),
      attackerStaggered: isStaggered(actor),
      attackerBuffs: activeBuffProfiles(actor),
      defenderBuffs: activeBuffProfiles(opponent),
      rollMods: actor.rollMods,
      suppressCrit: actor.critSuppressedRemaining > 0,
    });
    actor.rollMods = []; // consumed by this attack
    const dealt = result.hit ? applyDamageMultipliers(result.dealt, attackMultipliers(actor, opponent)) : 0;
    actor.lastAttack = { critical: result.critical, dealt };
    const remainingHp = result.hit ? dealDamage(opponent, dealt) : opponent.currentHp;
    log.push({
      kind: "rangedAttack",
      actorId: actor.snapshot.id,
      targetId: opponent.snapshot.id,
      hit: result.hit,
      attackRoll: result.attackRoll,
      st: result.st,
      raw: result.raw,
      reduced: result.hit ? result.raw - dealt : result.reduced,
      dealt,
      critical: result.critical,
      remainingHp,
    });
  }
  else if (action.kind === "spell")
  {
    // Magic ranged attack ("blokowane"): the defender may still react first.
    reactToAttack(opponent, actor, policies, random, log);

    const result = resolveRangedAttack(actor.snapshot, opponent.snapshot, random, {
      distanceST,
      category: rangedCategory("rangedMagic"),
      attackerStaggered: isStaggered(actor),
      attackerBuffs: activeBuffProfiles(actor),
      defenderBuffs: activeBuffProfiles(opponent),
      rollMods: actor.rollMods,
      offenseOverride: action.spell.offense,
      suppressCrit: actor.critSuppressedRemaining > 0,
    });
    actor.rollMods = []; // consumed by this cast
    const dealt = result.hit ? applyDamageMultipliers(result.dealt, attackMultipliers(actor, opponent)) : 0;
    actor.lastAttack = { critical: result.critical, dealt };
    const remainingHp = result.hit ? dealDamage(opponent, dealt) : opponent.currentHp;
    // Essence is deducted in recordAction (called right after); report the value it will hold.
    const remainingEssence = actor.resources.essence - action.spell.costEssence;
    log.push({
      kind: "spellCast",
      actorId: actor.snapshot.id,
      targetId: opponent.snapshot.id,
      spellId: action.spell.id,
      spellName: action.spell.name,
      hit: result.hit,
      attackRoll: result.attackRoll,
      st: result.st,
      raw: result.raw,
      reduced: result.hit ? result.raw - dealt : result.reduced,
      dealt,
      critical: result.critical,
      remainingHp,
      costEssence: action.spell.costEssence,
      remainingEssence,
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
    applyEffects(action.maneuver.effects, actor, opponent, { random, log });
  }
}

/**
 * Reaction hook: when `defender` is attacked by `attacker`, the defender's
 * policy may spend ONE reactive (instant) maneuver in response, resolved before
 * the attack's damage. A defensive self-buff thus lowers the incoming hit; an
 * offensive reaction damages/debuffs the attacker. Cooldown / once-per-turn are
 * respected via `canUseCastable`; reactions don't recurse (effects never
 * trigger further attacks).
 */
function reactToAttack(
  defender: CombatantRuntime,
  attacker: CombatantRuntime,
  policies: Map<string, ActionPolicy>,
  random: () => number,
  log: CombatLogBuilder,
): void
{
  if (!defender.alive) return;

  const reactive = availableReactiveManeuvers(defender);
  if (reactive.length === 0) return;

  const policy = policies.get(defender.snapshot.id)!;
  const choice = policy.chooseAction(defender, attacker, [{ kind: "pass" }, ...reactive]);
  if (choice.kind !== "maneuver") return;

  log.push({
    kind: "reaction",
    actorId: defender.snapshot.id,
    targetId: attacker.snapshot.id,
    maneuverId: choice.maneuver.id,
    maneuverName: choice.maneuver.name,
  });
  applyEffects(choice.maneuver.effects, defender, attacker, { random, log });
  recordAction(defender, choice);
}

function tickStatuses(
  runtime: CombatantRuntime,
  random: () => number,
  log: CombatLogBuilder,
): void
{
  const survivors: typeof runtime.statuses = [];

  for (const status of runtime.statuses)
  {
    if (status.tick)
    {
      const perStack = rollDamageSpec(status.tick.damage, random);
      const amount = perStack * status.stacks;
      const dealt = reduceDamage(amount, selectDefaultDefense(runtime.snapshot), status.tick.damageType);
      const remainingHp = dealDamage(runtime, dealt, bypassesBarrier(status.tick.damageType));
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

function tickBuffs(runtime: CombatantRuntime): void
{
  runtime.activeBuffs = runtime.activeBuffs
    .map(b => ({ ...b, remaining: b.remaining - 1 }))
    .filter(b => b.remaining > 0);
}

function tickMultipliers(runtime: CombatantRuntime): void
{
  runtime.activeMultipliers = runtime.activeMultipliers
    .map(m => ({ ...m, remaining: m.remaining - 1 }))
    .filter(m => m.remaining > 0);
}

/** Expire a temporary stance/state rank bonus ("podnieś rangę o N" for K rund). */
function tickRankBonus(runtime: CombatantRuntime): void
{
  for (const active of [runtime.activeStance, runtime.activeState])
  {
    if (active && active.rankBonusRemaining > 0)
    {
      active.rankBonusRemaining -= 1;
      if (active.rankBonusRemaining === 0) active.rankBonus = 0;
    }
  }
}

/** Re-apply the active stance & state effects at the (rank-adjusted) grade. */
function autoCastModes(actor: CombatantRuntime, opponent: CombatantRuntime, random: () => number, log: CombatLogBuilder): void
{
  for (const active of [actor.activeStance, actor.activeState])
  {
    if (!active) continue;
    const grade = active.mode.baseGrade + active.rankBonus;
    const effects = variantEffectsAt(
      { name: active.mode.name, variantsByGrade: active.mode.variantsByGrade, grades: active.grades },
      grade,
    );
    if (effects.length > 0) applyEffects(effects, actor, opponent, { random, log });
  }
}

/**
 * The damage multipliers that apply to an attack from `actor` to `opponent`:
 * the actor's `damageDealt` scalers followed by the opponent's `damageTaken`
 * scalers. Applied to the post-reduction amount (see `applyDamageMultipliers`).
 */
function attackMultipliers(actor: CombatantRuntime, opponent: CombatantRuntime): { factor: number; rounding: "up" | "down" | "nearest" }[]
{
  return [
    ...actor.activeMultipliers.filter(m => m.target === "damageDealt"),
    ...opponent.activeMultipliers.filter(m => m.target === "damageTaken"),
  ];
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
