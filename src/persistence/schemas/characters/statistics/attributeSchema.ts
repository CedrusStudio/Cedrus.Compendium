import { z } from "zod";
import { statisticSchema } from "@/persistence/schemas/characters/statistics/statisticSchema";

export const attributesSchema = z.object
({
  fencing: statisticSchema,
  artifice: statisticSchema,
  precision: statisticSchema,
  initiative: statisticSchema,
  martialArt: statisticSchema,
  horsemanship: statisticSchema,

  fortitude: statisticSchema,
  reflex: statisticSchema,
  willpower: statisticSchema,
});