import { z } from "zod";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";
import { castableSchema } from "@/persistence/schemas/characters/castableSchema";

export const castablePerkSchema = perkSchema.extend
({
  ...castableSchema.shape
});

export const maneuverSchema = castablePerkSchema;
export const addManeuverSchema = maneuverSchema.omit({ id: true });

export const maneuversSchema = z.array(maneuverSchema).max(100, { message: "Możesz mieć najwyżej 100 manewrów." });

export type ManeuverDto = z.infer<typeof maneuverSchema>;
export type CastablePerkDto = z.infer<typeof castablePerkSchema>;
export type AddManeuverDto = z.infer<typeof addManeuverSchema>;
