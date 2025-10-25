import { z } from "zod";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";
import { castableSchema } from "@/persistence/schemas/characters/castableSchema";

export const maneuverSchema = perkSchema.extend
({
  ...castableSchema.shape
});

export const addManeuverSchema = perkSchema.extend
({
  ...castableSchema.shape
}).omit({ id: true });

export const maneuversSchema = z.array(maneuverSchema).max(100, { message: "Możesz mieć najwyżej 100 manewrów." });

export type ManeuverDto = z.infer<typeof maneuverSchema>;
export type AddManeuverDto = z.infer<typeof addManeuverSchema>;
