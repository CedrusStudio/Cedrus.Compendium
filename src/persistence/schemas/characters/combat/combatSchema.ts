import { z } from "zod";
import { healthSchema } from "@/persistence/schemas/characters/combat/healthSchema";
import { defenseSchema } from "@/persistence/schemas/characters/combat/defenseSchema";
import { modesSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import { maneuversSchema } from "@/persistence/schemas/characters/combat/maneuverSchema";
import { offenseSchema } from "@/persistence/schemas/characters/combat/offenseSchema";
import { powersSchema } from "@/persistence/schemas/characters/combat/powerSchema";

export const combatSchema = z.object
({
  health: healthSchema,
  defenses: z.array(defenseSchema).max(10, { message: "Możesz mieć najwyżej 10 zestawów obrony." }),
  defaultDefenseId: z.string().optional().nullable(),
  stances: modesSchema,
  states: modesSchema,
  maneuvers: maneuversSchema,
  offenses: z.array(offenseSchema).max(10, { message: "Możesz mieć najwyżej 10 zestawów ataku." }),
  defaultOffenseId: z.string().optional().nullable(),
  powers: powersSchema
});

export type CombatDto = z.infer<typeof combatSchema>;
