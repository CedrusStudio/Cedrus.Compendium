import { z } from "zod";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";
import { effectSchema } from "@/domain/combat-lab/effects/effectSchema";

// Base mode (stance/state) DTO — used by the character sheet form and lists.
// Deliberately WITHOUT the recursive `effects` field, mirroring maneuverSchema:
// embedding the self-recursive Effect union in the character combat form makes
// react-hook-form's Path type explode (TS2589). Effects are authored in the
// compendium via `modeWithEffectsSchema` below.
export const modeSchema = perkSchema;
export const modesSchema = z.array(modeSchema).max(20, { message: "Możesz mieć najwyżej 20 trybów." });
export const addModeSchema = modeSchema.omit({ id: true });

// Compendium stance/state editor: base + Combat Lab effects/simulatable/reason.
export const modeWithEffectsSchema = modeSchema.extend
({
  effects: z.array(effectSchema).optional(),
  simulatable: z.boolean().nullish(),
  unsupportedReason: z.string().max(500).nullish(),
});
export const addModeWithEffectsSchema = modeWithEffectsSchema.omit({ id: true });

export type ModeDto = z.infer<typeof modeSchema>;
export type ModeWithEffectsDto = z.infer<typeof modeWithEffectsSchema>;
export type AddModeDto = z.infer<typeof addModeSchema>;