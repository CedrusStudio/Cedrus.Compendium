import { z } from "zod";
import { statisticSchema } from "@/persistence/schemas/characters/statistics/statisticSchema";

export const characteristicsSchema = z.object
({
  strength: statisticSchema,
  dexterity: statisticSchema,
  constitution: statisticSchema,
  mind: statisticSchema,
  charisma: statisticSchema,
  spellborn: statisticSchema,
});