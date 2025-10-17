import { z } from "zod";
import { characteristicsSchema } from "@/persistence/schemas/characters/statistics/characteristicSchema";
import { attributesSchema } from "@/persistence/schemas/characters/statistics/attributeSchema";

export const statisticsSchema = z.object
({
  characteristics: characteristicsSchema,
  attributes: attributesSchema,
});

export type StatisticsDto = z.infer<typeof statisticsSchema>;