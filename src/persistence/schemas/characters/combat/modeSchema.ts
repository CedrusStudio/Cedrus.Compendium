import { z } from "zod";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";

export const modeSchema = perkSchema;
export const modesSchema = z.array(modeSchema).max(20, { message: "Możesz mieć najwyżej 20 trybów." });
export const addModeSchema = modeSchema.omit({ id: true });

export type ModeDto = z.infer<typeof modeSchema>;
export type AddModeDto = z.infer<typeof addModeSchema>;