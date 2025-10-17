import { z } from "zod";
import { healthSchema } from "@/persistence/schemas/characters/combat/healthSchema";
import { defenseSchema } from "@/persistence/schemas/characters/combat/defenseSchema";
import { modesSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import { maneuversSchema } from "@/persistence/schemas/characters/combat/maneuverSchema";
import { offenseSchema } from "@/persistence/schemas/characters/combat/offenseSchema";
import { powersSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";

export const combatSchema = z.object
({
  health: healthSchema,
  defenses: z.array(defenseSchema).max(10, { message: "Możesz mieć najwyżej 10 zestawów obrony." }),
  stances: modesSchema,
  states: modesSchema,
  maneuvers: maneuversSchema,
  offenses: z.array(offenseSchema).max(10, { message: "Możesz mieć najwyżej 10 zestawów ataku." }),
  powers: powersSchema,
  perks: z.array(perkSchema).max(300, { message: "Możesz mieć najwyżej 300 perków." })
});

export type CombatDto = z.infer<typeof combatSchema>;
