import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";

const criticalSchema = z.object
({
  power: z.coerce.number<number>().int().min(-5, { message: "Sia Krytyka musi mieć co najmniej -5." }).max(50, { message: "Sia Krytyka musi mieć najwyżej 50." }),
  range: z.coerce.number<number>().int().min(-5, { message: "Zasięg Krytyka musi mieć co najmniej -5." }).max(50, { message: "Zasięg Krytyka musi mieć najwyżej 50." }),
});

export const damageOffenseSchema = z.object
({ 
  amount: z.coerce.number<number>().int().min(0, { message: "Ilość musi być co najmniej 0." }).max(10, { message: "Ilość musi być najwyżej 10." }),
  grade: z.coerce.number<number>().int().min(1, { message: "Ranga musi być co najmniej 1." }).max(50, { message: "Ranga musi być najwyżej 50." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(50, { message: "Bonus musi być najwyżej 50." }),
  isPhantom: z.boolean()
});

export const weaponOffenseSchema = damageOffenseSchema.extend
({
  critical: criticalSchema
}); 

export const offenseSchema = entitySchema.extend
({
  description: z.string().min(2).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }).optional(),
  leadingWeapon: weaponOffenseSchema,
  secondaryWeapon: weaponOffenseSchema.optional(),
  damageBonus: damageOffenseSchema
});

export type OffenseDto = z.infer<typeof offenseSchema>;
