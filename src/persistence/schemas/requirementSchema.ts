import { z } from "zod";
import {
  ENTITY_REQUIREMENT_GROUPS,
  REQUIREMENT_TARGET_GROUPS,
  STATISTIC_REQUIREMENT_GROUPS,
  type EntityRequirementGroup,
  type Requirement,
  type RequirementTargetGroup,
  type StatisticRequirementGroup,
} from "@/domain/requirements/Requirement";

/**
 * Zod schema for the structured requirement model (Wave 5, 5.1).
 *
 * Discriminated union on `kind`, mirroring `Requirement` in
 * `@/domain/requirements/Requirement`:
 *  - `rankless`: normalized free-text (`text`).
 *  - `ranked`:   `group` + `targetKey` + minimum `value`.
 *
 * `value` is an unconstrained integer on purpose — a negative threshold is a
 * valid (if trivially satisfied) requirement, and the comparison engine handles
 * it. Emptiness / bounds are enforced at the form layer.
 */

const targetGroupSchema = z.enum(
  REQUIREMENT_TARGET_GROUPS as unknown as [RequirementTargetGroup, ...RequirementTargetGroup[]],
);

export const ranklessRequirementSchema = z.object({
  kind: z.literal("rankless"),
  text: z.string().min(1, { message: "Wymaganie nie może być puste." }),
});

export const rankedRequirementSchema = z.object({
  kind: z.literal("ranked"),
  group: targetGroupSchema,
  targetKey: z.string().min(1, { message: "Wybierz cel wymagania." }),
  value: z.number().int({ message: "Ranga musi być liczbą całkowitą." }),
});

const statisticGroupSchema = z.enum(
  STATISTIC_REQUIREMENT_GROUPS as unknown as [StatisticRequirementGroup, ...StatisticRequirementGroup[]],
);

const entityGroupSchema = z.enum(
  ENTITY_REQUIREMENT_GROUPS as unknown as [EntityRequirementGroup, ...EntityRequirementGroup[]],
);

/** Wave 7.4 — additive requirement over statistics. Only `>=`; see `SumRequirement`. */
export const sumRequirementSchema = z.object({
  kind: z.literal("sum"),
  targets: z.array(z.object({
    group: statisticGroupSchema,
    targetKey: z.string().min(1, { message: "Wybierz cechę." }),
  })).min(2, { message: "Suma potrzebuje co najmniej dwóch cech." }),
  value: z.number().int({ message: "Wartość musi być liczbą całkowitą." }),
});

/**
 * Wave 7.3 — alternative. At least two options: a one-element alternative is
 * just the option itself wearing a costume, and allowing it would give two
 * different encodings of the same thing to every consumer.
 *
 * Options are everything except another composite — including free text, since
 * "Lekka lub średnia zbroja" has no structured target on either side. Nesting is
 * excluded so the Mongo filter's single `$elemMatch` level stays sufficient.
 */
export const anyOfRequirementSchema = z.object({
  kind: z.literal("anyOf"),
  options: z
    .array(z.discriminatedUnion("kind", [rankedRequirementSchema, ranklessRequirementSchema, sumRequirementSchema]))
    .min(2, { message: "Alternatywa potrzebuje co najmniej dwóch celów." }),
});

/** Wave 8.1 — "own at least N of a kind". */
export const countRequirementSchema = z.object({
  kind: z.literal("count"),
  groups: z.array(entityGroupSchema).min(1, { message: "Wybierz co najmniej jedną grupę." }),
  tag: z.string().optional(),
  minGrade: z.number().int().optional(),
  value: z.number().int({ message: "Liczba musi być całkowita." }),
});

export const requirementSchema = z.discriminatedUnion("kind", [
  ranklessRequirementSchema,
  rankedRequirementSchema,
  anyOfRequirementSchema,
  sumRequirementSchema,
  countRequirementSchema,
]);

export const requirementsSchema = z.array(requirementSchema);

export type RequirementInput = z.infer<typeof requirementSchema>;

// Compile-time guard: the Zod output must stay structurally identical to the
// domain `Requirement` type. If either drifts, this line stops compiling.
const _typeCheck: Requirement = {} as RequirementInput;
void _typeCheck;
