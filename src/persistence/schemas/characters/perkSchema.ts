import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";

export const perkSchema = entitySchema.extend
({
  grade: z.coerce.number<number>().int().min(0, { message: "Ranga musi mieć co najmniej 0." }).max(20, { message: "Ranga musi być najwyżej 20." }),
  description: z.string().min(2).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
  requirements: z.string().max(1000, { message: "Wymagania muszą mieć najwyżej 1000 znaków." }).optional(),
  price: z.coerce.number<number>().int().min(0, { message: "Cena musi mieć co najmniej 0." }).max(180, { message: "Cena musi być najwyżej 180." }),
});

export const perksSchema = z.array(perkSchema).max(500, { message: "Możesz mieć najwyżej 500 manewrów." });

export type PerkDto = z.infer<typeof perkSchema>;