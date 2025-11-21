import { allowedStyles } from "@/domain/characters/equipment/Weapon";
import { z } from "zod";
import { itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";
import { phantomDamageOffenseSchema, weaponOffenseSchema } from "@/persistence/schemas/characters/combat/offenseSchema";

export const weaponSchema = itemSchema.extend
({
  style: z.enum(allowedStyles),
  offense: weaponOffenseSchema,
  damageBonus: phantomDamageOffenseSchema,
  range: z.coerce.number<number>().int().min(-5, { message: "Zasięg Krytyka musi mieć co najmniej -5." }).max(50, { message: "Zasięg Krytyka musi mieć najwyżej 50." }),
});

export type WeaponDto = z.infer<typeof weaponSchema>;