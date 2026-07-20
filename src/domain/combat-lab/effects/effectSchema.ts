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

const resourceKinds = ["mana", "essence", "action"] as const satisfies readonly ResourceKind[];

export const damageSpecSchema = z.object({
  amount: z.number().int().min(0),
  grade: z.number().int().min(0),
  bonus: z.number().int(),
  isPhantom: z.boolean().optional(),
});

const buffProfileRefSchema = z.object({
  profileId: z.string().min(1),
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
      resource: z.enum(resourceKinds),
      delta: z.number().int(),
    }),
    z.object({
      type: z.literal("chance"),
      chance: z.number().min(0).max(100),
      then: z.array(effectSchema),
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

export const actionCostSchema = z.object({
  castTime: castTimeSchema,
  mana: z.number().int().min(0).optional(),
  essence: z.number().int().min(0).optional(),
});

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
