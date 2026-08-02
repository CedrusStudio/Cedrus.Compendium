/**
 * Data-driven, machine-readable model of what a maneuver DOES.
 *
 * Today a `Maneuver` (= `Perk & Castable`) only carries a human `description`
 * string — the engine cannot read mechanics out of prose. To simulate fights
 * and analyse balance, every maneuver needs a structured `Effect[]` the engine
 * can interpret. The player-facing description is then generated FROM this data
 * (see `describeManeuver.ts`), mirroring the YAML example in
 * features-to-implement/combat-simulator.md ("Model manewrów").
 *
 * Pure domain: no React/Next/Prisma imports.
 */

/**
 * A dice/flat quantity, deliberately the same shape as `DamageOffense` in
 * characters/combat/Offense.ts so damage effects flow through the SAME roll
 * helpers (`handleDamageOffenseRolls`) as weapon attacks — one code path for
 * all damage.
 */
export type DamageSpec =
{
  amount: number;
  grade: number;
  bonus: number;
  isPhantom?: boolean;
  /** Dynamic dice rank: resolve `grade` from a statistic at roll time
   * ("kość równa sile"). Overrides `grade` when present. `who` defaults to self. */
  gradeFromStat?: { group: "attributes" | "characteristics"; key: string; who?: "self" | "target" };
};

/**
 * Damage category — the rulebook axis that decides WHICH defensive layers apply
 * (public/data/rulebook/system-walki.json, "Defensywa"). This is NOT an elemental
 * type: the system has no per-element resistance (an "attack ognia" is simply a
 * blocking attack). The category maps directly to a reduction mode:
 *   - "zwyczajne"    → pełna redukcja (block+parry+dodge+armor+unique) — melee.
 *   - "blokowane"    → redukcja blokowalna (armor+block+unique; no dodge/parry)
 *                      — magic ranged, or attacks you can block but not dodge.
 *   - "bezpośrednie" → redukcja bezpośrednia (armor+unique; no dodge/parry/block)
 *                      — would hit a motionless, non-blocking target (e.g. arrows).
 *   - "śmiertelne"   → ignores resistance AND reduction AND barrier (np. trucizna).
 *   - "nieuchronne"  → ignores resistance and reduction (barrier still applies).
 */
export type DamageType =
  | "zwyczajne"
  | "blokowane"
  | "bezpośrednie"
  | "śmiertelne"
  | "nieuchronne";

/** Statuses the engine tracks on a combatant over time. */
export type StatusId =
  | "bleeding"
  | "poisoned"
  | "burning"
  | "stagger"
  | "stun"
  | "root"
  | "disarm"
  | "slow"
  | "marked";

export type ControlKind = "stun" | "root" | "disarm" | "silence";

export type ResourceKind = "essence" | "action";

/** Reference to a `BuffProfile` carried by the character (buffs/BuffProfile.ts). */
export type BuffProfileRef =
{
  profileId: string;
};

export type DamageEffect =
{
  type: "damage";
  damage: DamageSpec;
  damageType: DamageType;
  /** Whether this damage can crit (weapon-derived effects usually can). */
  canCrit?: boolean;
};

export type HealEffect =
{
  type: "heal";
  amount: DamageSpec;
};

/** Per-round damage carried by a damage-over-time status (bleeding, poison…). */
export type DamageTick =
{
  damage: DamageSpec;
  damageType: DamageType;
};

export type StatusEffect =
{
  type: "status";
  status: StatusId;
  /** Duration in rounds. `0` / omitted = instantaneous. */
  duration: number;
  stacks?: number;
  /** If present, deals this damage to the afflicted combatant each round. */
  tick?: DamageTick;
};

export type BuffEffect =
{
  type: "buff";
  profile: BuffProfileRef;
  duration: number;
};

export type DebuffEffect =
{
  type: "debuff";
  profile: BuffProfileRef;
  duration: number;
};

export type PushEffect =
{
  type: "push";
  distance: number;
};

export type PullEffect =
{
  type: "pull";
  distance: number;
};

/** Union of the two movement effects (kept for callers that treat them alike). */
export type MoveEffect = PushEffect | PullEffect;

export type ControlEffect =
{
  type: "control";
  control: ControlKind;
  duration: number;
};

export type ResourceEffect =
{
  type: "resource";
  resource: ResourceKind;
  /** Positive = grant, negative = drain. */
  delta: number;
};

/**
 * Inline stat modifier — the authorable form of a buff/debuff that does NOT
 * require a pre-existing `BuffProfile`. Carries flat deltas directly (mirroring
 * the simulation's `createTempBuff` fields), so defensive maneuvers ("+2 blok
 * przez rundę"), offensive stat maneuvers ("+1 ranga kości"), and opponent
 * debuffs (negative values, `mode: "target"`) are all expressible in the editor.
 *
 * At apply time the engine builds a throwaway `BuffProfile` from these fields
 * and pushes it as an ActiveBuff on the recipient — reusing the exact same
 * effectiveOffense/effectiveDefense path as profile-based buffs. For an opponent
 * debuff, use `mode: "target"` and negative values.
 */
export type StatBuffEffect =
{
  type: "stat";
  /** "self" = buff on the caster; "target" = applied to the opponent. */
  mode: "self" | "target";
  /** Duration in rounds. */
  duration: number;
  // Defence layers.
  block?: number;
  parry?: number;
  dodge?: number;
  protection?: number;
  resistance?: number;
  /** Niewrażliwość — removes attacker dice before the roll. */
  immunity?: number;
  // Offence.
  /** Flat damage bonus. */
  damage?: number;
  /** Leading-weapon dice rank (k = rank × 2). */
  diceGrade?: number;
  /** Critical power (premia obrażeń krytyka). */
  critPower?: number;
  /** Critical range — widens the crit window (krytyk gdy roll ≥ grade*2 − range). */
  critRange?: number;
  /** Suppress critical hits entirely (mode "self" = caster can't crit; "target"
   * = opponent can't crit). Buffs only ADD, so zeroing crit needs its own flag. */
  critDisabled?: boolean;
  // Test stats.
  precision?: number;
  reflex?: number;
  initiative?: number;
  // Health.
  barrier?: number;
};

/**
 * Multiplier (procent / mnożnik) — scales damage by a factor, unlike every other
 * effect which is additive. Attached to a combatant for `duration` rounds and
 * applied at the END of an attack (after the roll and flat reduction).
 *   - target "damageDealt" — scales damage this combatant DEALS ("podwaja obrażenia" → 2).
 *   - target "damageTaken" — scales damage this combatant TAKES ("−10% obrażeń" → 0.9).
 *   - mode "self"/"target" — whom the multiplier is attached to (debuff = "target").
 * Multiple multipliers of the same target compound (multiply). Rounding of the
 * final value defaults to "up" (podręcznik: „zaokrąglone w górę").
 */
export type MultiplierEffect =
{
  type: "multiplier";
  mode: "self" | "target";
  target: "damageDealt" | "damageTaken";
  /** Multiplicative factor (2 = double, 0.9 = −10%). */
  factor: number;
  rounding?: "up" | "down" | "nearest";
  duration: number;
};

/**
 * Raise (or lower) the caster's active stance/state RANK for `duration` rounds
 * ("podnosisz rangę postaw o 1"). The rank bump swaps the auto-cast to the
 * grade+delta variant of the active mode (see engine-model-gaps §1).
 */
export type StanceRankEffect =
{
  type: "stanceRank";
  delta: number;
  duration: number;
  /** Which slot to bump — defaults to the stance. */
  target?: "stance" | "state";
};

/**
 * Lock the caster out of anything carrying a library TAG — the shape of the
 * Amok state: „uniemożliwia defensywne postawy i manewry".
 *
 * Deliberately keyed on the tag rather than a hardcoded category: „defensywne"
 * is a real tag in the library, so the rule stays where the content authors
 * already work, and any future „uniemożliwia X" needs no engine change.
 *
 * A `duration` of 0 means "for as long as this is re-applied", which is how
 * stances and states behave: their effects re-fire at the start of every turn,
 * so the ban simply persists while the mode is worn.
 */
export type ForbidTagEffect =
{
  type: "forbidTag";
  tag: string;
  /** What the ban covers. Defaults to everything. */
  scope?: "maneuvers" | "stances" | "all";
  duration: number;
};

/**
 * Roll modifier (T2b) — changes HOW this turn's attack is rolled, rather than
 * adding a post-hoc effect. Applied to the caster and consumed by the next
 * attack this turn (see runCombat + resolveAttack). Deterministic: `advantage`/
 * `disadvantage` consume a second full roll from the seeded rng; `extraDie`
 * consumes one extra die roll.
 *   - "advantage"    → roll the whole offense twice, keep the higher total.
 *   - "disadvantage" → roll twice, keep the lower total.
 *   - "extraDie"     → add one weapon die of rank `grade` (k = grade × 2).
 */
export type RollModifierKind = "advantage" | "disadvantage" | "extraDie";

export type RollModifierEffect =
{
  type: "roll";
  modifier: RollModifierKind;
  /** For "extraDie": rank of the added die (k = grade × 2). Defaults to 3 (k6). */
  grade?: number;
};

/**
 * Contested test (T2c) — an opposed skill roll that gates (and optionally scales)
 * its effects. See features-to-implement/combat-lab-contested-test-plan.md.
 *
 * A `PoolTerm` is one summed slot; `anyOf` are alternatives ("refleks/siła" →
 * pick the best). A `TestSide` sums its terms, adds a flat `modifier`, may shift
 * the test die rank (`dieGradeDelta`) and roll with advantage/disadvantage.
 * Confirmed mechanic: contribution = value+bonus+testBonus; the die is one
 * k(maxGrade×2) from the highest-rank chosen stat; alternatives are picked by
 * max(testValue + grade); win when margin > 0 (tie → defender); scaling per 1
 * point of margin.
 */
export type SkillRef = { group: "attributes" | "characteristics"; key: string };
export type PoolTerm = { anyOf: SkillRef[] };
export type TestSide =
{
  pool: PoolTerm[];
  modifier?: number;
  dieGradeDelta?: number;
  rollMod?: "advantage" | "disadvantage";
};

export type ContestedTestEffect =
{
  type: "contested";
  attacker: TestSide;
  defender: TestSide;
  /** Effects applied on a win (margin > 0). */
  onWin: Effect[];
  /** Optional scaling: apply `effect` floor(margin / per) times (capped). */
  perMargin?: { per: number; effect: Effect; cap?: number };
  /** Who receives onWin/perMargin: "target" (opponent, default) or "self". */
  onWinTarget?: "self" | "target";
};

/**
 * Save test (T2c sibling) — one side rolls a `TestSide` against a FIXED ST (not
 * an opposed pool). Models "Test wytrwałości o ST=7. Za każde oczko straty
 * zadaje 1dmg": the target rolls its pool; on a failed save (roll < st) the
 * `onFail` effects apply, scaled by the margin of failure (st − roll).
 * Confirmed: fortitude (PL "wytrwałość") is the usual pool stat.
 */
export type SaveTestEffect =
{
  type: "save";
  pool: TestSide;
  st: number;
  /** Who makes the save: "target" (default — the one hit) or "self". */
  who?: "self" | "target";
  onFail: Effect[];
  /** Scaling by margin of failure (st − roll): apply floor(margin/per) times. */
  perMarginOfFailure?: { per: number; effect: Effect; cap?: number };
};

/**
 * Deterministic condition for a `WhenEffect` — a pre-condition/trigger that
 * gates effects (mirrors the "tylko przeciw walce wręcz", "gdy cel ma status",
 * "przy trafieniu krytycznym", "gdy zadano obrażenia" clauses in the data).
 * Only conditions representable in the 1-on-1 model are included; positional /
 * charge conditions ("z powietrza", "przeciw szarży") are intentionally omitted.
 */
export type EffectCondition =
  | { kind: "opponentAttackKind"; value: "melee" | "rangedPhysical" | "rangedMagic" }
  | { kind: "targetHasStatus"; status: StatusId }
  | { kind: "selfHasStatus"; status: StatusId }
  | { kind: "onCritical" }
  | { kind: "onDamageDealt" }
  /** Positional context (set by the Scenario): the caster attacks from the air. */
  | { kind: "selfAirborne" }
  /** The opponent is charging (defending against a charge). */
  | { kind: "opponentCharging" }
  /** The caster has at least `min` of a resource (essence). */
  | { kind: "hasResource"; resource: "essence"; min: number };

/**
 * Conditional wrapper: the nested `then` effects fire only when `condition`
 * holds. Deterministic sibling of `chance`. Keeps `condition` out of every
 * effect branch — an effect "X tylko przeciw walce wręcz" becomes
 * `{ type: "when", condition: {...}, then: [X] }`.
 */
export type WhenEffect =
{
  type: "when";
  condition: EffectCondition;
  then: Effect[];
};

/**
 * Countable source for a `ScaleEffect` — the "za każde X" quantity. All are
 * readable from the current combat state (no external subsystem).
 */
export type ScaleSource =
  | { kind: "selfDice" }                                       // weapon dice the caster rolls ("za każdą kość broni", "+X na kość broni")
  | { kind: "opponentDice" }                                   // weapon dice the opponent rolls ("za każdą kość przeciwnika")
  | { kind: "opponentImmunity" }                               // opponent's niewrażliwość ("za każdą niewrażliwość wroga")
  | { kind: "selfResource"; resource: "essence" }              // caster's essence
  | { kind: "selfStatusStacks"; status: StatusId }
  | { kind: "targetStatusStacks"; status: StatusId }
  | { kind: "selfStat"; group: "attributes" | "characteristics"; key: string }      // caster's stat value ("równa sile")
  | { kind: "opponentStat"; group: "attributes" | "characteristics"; key: string }; // opponent's stat value ("równa umysłowi przeciwnika")

/**
 * Scaling wrapper: apply `effect` once per `per` units of `source` (capped),
 * modelling "za każde oczko/kość/… dodaje …". Deterministic sibling of `chance`.
 */
export type ScaleEffect =
{
  type: "scale";
  source: ScaleSource;
  /** Apply once per this many units (default 1). */
  per?: number;
  /** Max applications. */
  cap?: number;
  effect: Effect;
};

/**
 * Probabilistic wrapper: with `chance`% the nested `then` effects fire.
 * Enables e.g. "stagger 35%" from the Shield Bash example. Nesting is allowed
 * but the Rules Validator (v0.4) flags cycles.
 */
export type ChanceEffect =
{
  type: "chance";
  /** Percentage in [0, 100]. */
  chance: number;
  then: Effect[];
};

/**
 * Escape-hatch for plugin-provided effects (see combat-lab-plugin-system-plan.md,
 * §7 option A). The core union stays exhaustive for built-in effects; a plugin
 * effect rides in a single `custom` branch, keyed by `effectType`, with its
 * payload in `data` (validated by the plugin's own schema). The engine resolves
 * behaviour via the plugin registry.
 */
export type CustomEffect =
{
  type: "custom";
  effectType: string;
  data: Record<string, unknown>;
};

export type Effect =
  | DamageEffect
  | HealEffect
  | StatusEffect
  | BuffEffect
  | DebuffEffect
  | StatBuffEffect
  | MultiplierEffect
  | StanceRankEffect
  | ForbidTagEffect
  | RollModifierEffect
  | ContestedTestEffect
  | SaveTestEffect
  | WhenEffect
  | ScaleEffect
  | PushEffect
  | PullEffect
  | ControlEffect
  | ResourceEffect
  | ChanceEffect
  | CustomEffect;

export type EffectType = Effect["type"];

/** Narrowing helper used by the engine's effect interpreter. */
export function isEffectOfType<T extends EffectType>(
  effect: Effect,
  type: T,
): effect is Extract<Effect, { type: T }>
{
  return effect.type === type;
}

/**
 * Recursively collect every effect, flattening `chance.then` branches. Used by
 * analysers (which effects a maneuver can ever produce) and the Rules Validator.
 */
export function flattenEffects(effects: Effect[]): Effect[]
{
  const result: Effect[] = [];

  for (const effect of effects)
  {
    result.push(effect);
    if (effect.type === "chance")
    {
      result.push(...flattenEffects(effect.then));
    }
    else if (effect.type === "contested")
    {
      result.push(...flattenEffects(effect.onWin));
      if (effect.perMargin) result.push(...flattenEffects([effect.perMargin.effect]));
    }
    else if (effect.type === "save")
    {
      result.push(...flattenEffects(effect.onFail));
      if (effect.perMarginOfFailure) result.push(...flattenEffects([effect.perMarginOfFailure.effect]));
    }
    else if (effect.type === "when")
    {
      result.push(...flattenEffects(effect.then));
    }
    else if (effect.type === "scale")
    {
      result.push(...flattenEffects([effect.effect]));
    }
  }

  return result;
}
