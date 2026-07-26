import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";
import { tagsSchema } from "@/persistence/schemas/tagSchema";
import { requirementsSchema } from "@/persistence/schemas/requirementSchema";

export const perkSchema = entitySchema.extend
({
  grade: z.coerce.number<number>().int().min(0, { message: "Ranga musi mieć co najmniej 0." }).max(20, { message: "Ranga musi być najwyżej 20." }),
  description: z.string().min(0).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
  // Structured requirements (sole model after the legacy `requirements` cutover).
  structuredRequirements: requirementsSchema.optional(),
  price: z.coerce.number<number>().int().min(0, { message: "Cena musi mieć co najmniej 0." }).max(180, { message: "Cena musi być najwyżej 180." }),
  tags: tagsSchema
});

export const addPerkSchema = perkSchema.omit({ id: true });

export const perksSchema = z.array(perkSchema).max(500, { message: "Możesz mieć najwyżej 500 manewrów." });

export type PerkDto = z.infer<typeof perkSchema>;
export type AddPerkDto = z.infer<typeof addPerkSchema>;