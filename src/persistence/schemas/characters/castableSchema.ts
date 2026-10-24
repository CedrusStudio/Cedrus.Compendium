import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";
import { allowedCastTimes } from "@/domain/characters/Castable";

export const castableSchema = entitySchema.extend
({
  castTime: z.enum(allowedCastTimes),
  // MongoDB stores an absent optional cooldown as null in existing records.
  cooldown: z.preprocess(value => value === null ? undefined : value,
    numberInput(z.coerce.number<number>().int().min(0).max(20)).optional())
});
