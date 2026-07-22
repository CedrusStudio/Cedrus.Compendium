import { z } from "zod";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";
import { castableSchema } from "@/persistence/schemas/characters/castableSchema";
import { effectSchema } from "@/domain/combat-lab/effects/effectSchema";

export const castablePerkSchema = perkSchema.extend
({
  ...castableSchema.shape
});

// Base maneuver DTO — used by the character sheet form and the maneuver list.
// Deliberately does NOT include the recursive `effects` field: embedding the
// self-recursive Effect union inside the character combat form makes
// react-hook-form's Path type instantiation explode (TS2589). Effects are
// authored in the compendium via `maneuverWithEffectsSchema` below.
export const maneuverSchema = castablePerkSchema;
export const addManeuverSchema = maneuverSchema.omit({ id: true });

export const maneuversSchema = z.array(maneuverSchema).max(100, { message: "Możesz mieć najwyżej 100 manewrów." });

// Compendium maneuver editor: base + Combat Lab effects/simulatable/reason.
// Used only by the single-maneuver edit sheet (no array nesting → no TS2589).
export const maneuverWithEffectsSchema = castablePerkSchema.extend
({
  effects: z.array(effectSchema).optional(),
  simulatable: z.boolean().nullish(),
  unsupportedReason: z.string().max(500).nullish(),
});

export type ManeuverDto = z.infer<typeof maneuverSchema>;
export type ManeuverWithEffectsDto = z.infer<typeof maneuverWithEffectsSchema>;
export type CastablePerkDto = z.infer<typeof castablePerkSchema>;
export type AddManeuverDto = z.infer<typeof addManeuverSchema>;
