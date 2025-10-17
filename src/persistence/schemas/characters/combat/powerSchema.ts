import { z } from "zod";
import { allowedPowerTypes } from "@/domain/characters/combat/Power";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";
import { castableSchema } from "@/persistence/schemas/characters/castableSchema";
import { entitySchema } from "@/persistence/schemas/entitySchema";

const spellSchema = perkSchema.extend
({
  ...castableSchema.shape,
  cost: z.coerce.number<number>().int().min(0, { message: "Koszt musi mieć co najmniej 0." }).max(1000, { message: "Koszt musi być najwyżej 1000." })
});

export const powerSchema = entitySchema.extend
({
  type: z.enum(allowedPowerTypes),
  level: z.coerce.number<number>().int().min(0, { message: "Poziom musi mieć co najmniej 0." }).max(20, { message: "Poziom musi być najwyżej 20." }),
  bonus: z.coerce.number<number>().int().min(0, { message: "Bonus musi mieć co najmniej 0." }).max(10, { message: "Bonus musi mieć najwyżej 10." }),
  essence: z.coerce.number<number>().int().min(0, { message: "Esencja musi mieć co najmniej 0." }).max(15_000, { message: "Esencja musi mieć najwyżej 15000." }),
  spells: z.array(spellSchema).max(100, { message: "Możesz mieć najwyżej 100 zaklęć." }),
});

export const powersSchema = z.array(powerSchema).max(100, { message: "Możesz mieć najwyżej 100 mocy." });

export type SpellDto = z.infer<typeof spellSchema>;
export type PowerDto = z.infer<typeof powerSchema>;