import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";

const optionalCombatDescriptionSchema = z.union([
  z.literal(""),
  z.string().min(2).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
]).optional();

const criticalSchema = z.object
({
  power: numberInput(z.coerce.number<number>().int().min(-5, { message: "Sia Krytyka musi mieć co najmniej -5." }).max(50, { message: "Sia Krytyka musi mieć najwyżej 50." })),
  range: numberInput(z.coerce.number<number>().int().min(-5, { message: "Zasięg Krytyka musi mieć co najmniej -5." }).max(50, { message: "Zasięg Krytyka musi mieć najwyżej 50." })),
});

export const damageOffenseSchema = z.object
({ 
  amount: numberInput(z.coerce.number<number>().int().min(0, { message: "Ilość musi być co najmniej 0." }).max(50, { message: "Ilość musi być najwyżej 50." })),
  grade: numberInput(z.coerce.number<number>().int().min(1, { message: "Ranga musi być co najmniej 1." }).max(50, { message: "Ranga musi być najwyżej 50." })),
  bonus: numberInput(z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(50, { message: "Bonus musi być najwyżej 50." })),
  isPhantom: z.boolean()
});

export const weaponOffenseSchema = damageOffenseSchema.extend
({
  critical: criticalSchema
}); 

export const offenseSchema = entitySchema.extend
({
  description: optionalCombatDescriptionSchema,
  leadingWeapon: weaponOffenseSchema,
  secondaryWeapon: weaponOffenseSchema.optional(),
  damageBonus: damageOffenseSchema,
  additionalDamageBonus: damageOffenseSchema.optional()
});

export type OffenseDto = z.infer<typeof offenseSchema>;
