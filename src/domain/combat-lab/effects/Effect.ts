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

export type ResourceKind = "mana" | "essence" | "action";

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
  }

  return result;
}
