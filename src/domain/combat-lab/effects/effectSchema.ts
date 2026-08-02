/**
 * Zod schemas for `Effect` / `ManeuverDefinition`. Single source of runtime
 * validation for: (a) YAML/JSON import of maneuvers, (b) the maneuver effect
 * editor form (React Hook Form + @hookform/resolvers), (c) the Rules Validator.
 *
 * Zod is already a dependency of the repo (see package.json).
 */

import { z } from "zod";
import type {
  Effect,
  DamageType,
  StatusId,
  ControlKind,
  ResourceKind,
} from "@/domain/combat-lab/effects/Effect";
import type { CastTime } from "@/domain/characters/Castable";
import { allowedCastTimes } from "@/domain/characters/Castable";

const damageTypes = [
  "zwyczajne",
  "blokowane",
  "bezpośrednie",
  "śmiertelne",
  "nieuchronne",
] as const satisfies readonly DamageType[];

const statusIds = [
  "bleeding",
  "poisoned",
  "burning",
  "stagger",
  "stun",
  "root",
  "disarm",
  "slow",
  "marked",
] as const satisfies readonly StatusId[];

const controlKinds = ["stun", "root", "disarm", "silence"] as const satisfies readonly ControlKind[];

const resourceKinds = ["essence", "action"] as const satisfies readonly ResourceKind[];

/**
 * Backward-compat: legacy data may carry the removed "mana" resource. The system
 * operates only on Esencja, so any stored `"mana"` is normalized to `"essence"`
 * at parse time. Wraps a resource enum in a preprocess step.
 */
const legacyManaToEssence = (v: unknown) => (v === "mana" ? "essence" : v);
const resourceEffectKind = z.preprocess(legacyManaToEssence, z.enum(resourceKinds));
const resourcePoolKind = z.preprocess(legacyManaToEssence, z.enum(["essence"]));

export const damageSpecSchema = z.object({
  amount: z.number().int().min(0),
  grade: z.number().int().min(0),
  bonus: z.number().int(),
  isPhantom: z.boolean().optional(),
  gradeFromStat: z.object({
    group: z.enum(["attributes", "characteristics"]),
    key: z.string().min(1),
    who: z.enum(["self", "target"]).optional(),
  }).optional(),
});

const buffProfileRefSchema = z.object({
  profileId: z.string().min(1),
});

const skillRefSchema = z.object({
  group: z.enum(["attributes", "characteristics"]),
  key: z.string().min(1),
});

const poolTermSchema = z.object({
  anyOf: z.array(skillRefSchema).min(1),
});

const testSideSchema = z.object({
  pool: z.array(poolTermSchema).min(1),
  modifier: z.number().int().optional(),
  dieGradeDelta: z.number().int().optional(),
  rollMod: z.enum(["advantage", "disadvantage"]).optional(),
});

/**
 * `Effect` is a discriminated union with a self-referential `chance` branch, so
 * the schema is built with `z.lazy`. The explicit `z.ZodType<Effect>`
 * annotation ties the runtime schema to the compile-time type.
 */
export const effectSchema: z.ZodType<Effect> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("damage"),
      damage: damageSpecSchema,
      damageType: z.enum(damageTypes),
      canCrit: z.boolean().optional(),
    }),
    z.object({
      type: z.literal("heal"),
      amount: damageSpecSchema,
    }),
    z.object({
      type: z.literal("status"),
      status: z.enum(statusIds),
      duration: z.number().int().min(0),
      stacks: z.number().int().min(1).optional(),
      tick: z
        .object({
          damage: damageSpecSchema,
          damageType: z.enum(damageTypes),
        })
        .optional(),
    }),
    z.object({
      type: z.literal("buff"),
      profile: buffProfileRefSchema,
      duration: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("debuff"),
      profile: buffProfileRefSchema,
      duration: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("stat"),
      mode: z.enum(["self", "target"]),
      duration: z.number().int().min(0),
      block: z.number().int().optional(),
      parry: z.number().int().optional(),
      dodge: z.number().int().optional(),
      protection: z.number().int().optional(),
      resistance: z.number().int().optional(),
      immunity: z.number().int().optional(),
      damage: z.number().int().optional(),
      diceGrade: z.number().int().optional(),
      critPower: z.number().int().optional(),
      critRange: z.number().int().optional(),
      critDisabled: z.boolean().optional(),
      precision: z.number().int().optional(),
      reflex: z.number().int().optional(),
      initiative: z.number().int().optional(),
      barrier: z.number().int().optional(),
    }),
    z.object({
      type: z.literal("multiplier"),
      mode: z.enum(["self", "target"]),
      target: z.enum(["damageDealt", "damageTaken"]),
      factor: z.number().min(0),
      rounding: z.enum(["up", "down", "nearest"]).optional(),
      duration: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("stanceRank"),
      delta: z.number().int(),
      duration: z.number().int().min(0),
      target: z.enum(["stance", "state"]).optional(),
    }),
    z.object({
      type: z.literal("forbidTag"),
      tag: z.string().min(1),
      scope: z.enum(["maneuvers", "stances", "all"]).optional(),
      duration: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("roll"),
      modifier: z.enum(["advantage", "disadvantage", "extraDie"]),
      grade: z.number().int().min(1).optional(),
    }),
    z.object({
      type: z.literal("push"),
      distance: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("pull"),
      distance: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("control"),
      control: z.enum(controlKinds),
      duration: z.number().int().min(0),
    }),
    z.object({
      type: z.literal("resource"),
      resource: resourceEffectKind,
      delta: z.number().int(),
    }),
    z.object({
      type: z.literal("contested"),
      attacker: testSideSchema,
      defender: testSideSchema,
      onWin: z.array(effectSchema),
      perMargin: z.object({
        per: z.number().int().min(1),
        effect: effectSchema,
        cap: z.number().int().min(0).optional(),
      }).optional(),
      onWinTarget: z.enum(["self", "target"]).optional(),
    }),
    z.object({
      type: z.literal("save"),
      pool: testSideSchema,
      st: z.number().int(),
      who: z.enum(["self", "target"]).optional(),
      onFail: z.array(effectSchema),
      perMarginOfFailure: z.object({
        per: z.number().int().min(1),
        effect: effectSchema,
        cap: z.number().int().min(0).optional(),
      }).optional(),
    }),
    z.object({
      type: z.literal("when"),
      condition: z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("opponentAttackKind"), value: z.enum(["melee", "rangedPhysical", "rangedMagic"]) }),
        z.object({ kind: z.literal("targetHasStatus"), status: z.enum(statusIds) }),
        z.object({ kind: z.literal("selfHasStatus"), status: z.enum(statusIds) }),
        z.object({ kind: z.literal("onCritical") }),
        z.object({ kind: z.literal("onDamageDealt") }),
        z.object({ kind: z.literal("selfAirborne") }),
        z.object({ kind: z.literal("opponentCharging") }),
        z.object({ kind: z.literal("hasResource"), resource: resourcePoolKind, min: z.number().int() }),
      ]),
      then: z.array(effectSchema),
    }),
    z.object({
      type: z.literal("scale"),
      source: z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("selfDice") }),
        z.object({ kind: z.literal("opponentDice") }),
        z.object({ kind: z.literal("opponentImmunity") }),
        z.object({ kind: z.literal("selfResource"), resource: resourcePoolKind }),
        z.object({ kind: z.literal("selfStatusStacks"), status: z.enum(statusIds) }),
        z.object({ kind: z.literal("targetStatusStacks"), status: z.enum(statusIds) }),
        z.object({ kind: z.literal("selfStat"), group: z.enum(["attributes", "characteristics"]), key: z.string().min(1) }),
        z.object({ kind: z.literal("opponentStat"), group: z.enum(["attributes", "characteristics"]), key: z.string().min(1) }),
      ]),
      per: z.number().int().min(1).optional(),
      cap: z.number().int().min(0).optional(),
      effect: effectSchema,
    }),
    z.object({
      type: z.literal("chance"),
      chance: z.number().min(0).max(100),
      then: z.array(effectSchema),
    }),
    z.object({
      type: z.literal("custom"),
      effectType: z.string().min(1),
      data: z.record(z.string(), z.unknown()),
    }),
  ]),
);

const mechanicalRequirementSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("weapon"), value: z.string().min(1) }),
  z.object({ kind: z.literal("shield") }),
  z.object({ kind: z.literal("statusOnTarget"), value: z.string().min(1) }),
  z.object({ kind: z.literal("statusOnSelf"), value: z.string().min(1) }),
  z.object({ kind: z.literal("minStat"), stat: z.string().min(1), value: z.number().int() }),
]);

const castTimeSchema = z.enum(allowedCastTimes as unknown as [CastTime, ...CastTime[]]);

export const actionCostSchema = z.preprocess(
  (v) => {
    // Backward-compat: fold legacy `mana` cost into `essence` (single-resource system).
    if (v && typeof v === "object" && "mana" in v)
    {
      const { mana, ...rest } = v as Record<string, unknown>;
      const manaNum = typeof mana === "number" ? mana : 0;
      const essenceNum = typeof rest.essence === "number" ? rest.essence : 0;
      const essence = essenceNum + manaNum;
      return essence > 0 ? { ...rest, essence } : rest;
    }
    return v;
  },
  z.object({
    castTime: castTimeSchema,
    essence: z.number().int().min(0).optional(),
  }),
);

/**
 * Schema for the combat-lab specific additions to a maneuver. Kept separate
 * from the base `Maneuver` shape (which has its own persistence mapping) — this
 * validates only `effects` / `hardRequirements` / `cost`.
 */
export const maneuverDefinitionExtrasSchema = z.object({
  effects: z.array(effectSchema),
  hardRequirements: z.array(mechanicalRequirementSchema),
  cost: actionCostSchema,
});

export type ManeuverDefinitionExtras = z.infer<typeof maneuverDefinitionExtrasSchema>;

/** Validate an unknown value as an `Effect`, returning a typed result. */
export function parseEffect(value: unknown): ReturnType<typeof effectSchema.safeParse>
{
  return effectSchema.safeParse(value);
}
