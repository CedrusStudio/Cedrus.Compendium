import { z } from "zod";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";

export const modeSchema = perkSchema;
export const modesSchema = z.array(modeSchema).max(20, { message: "Możesz mieć najwyżej 20 trybów." });

export type ModeDto = z.infer<typeof modeSchema>;