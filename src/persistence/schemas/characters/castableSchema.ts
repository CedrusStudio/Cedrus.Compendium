import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";
import { allowedCastTimes } from "@/domain/characters/Castable";

export const castableSchema = entitySchema.extend
({
  castTime: z.enum(allowedCastTimes),
  cooldown: z.coerce.number<number>().int().min(0).max(20).optional()
});