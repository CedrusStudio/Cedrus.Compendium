import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";
import { tagsSchema } from "@/persistence/schemas/tagSchema";
import { requirementsSchema } from "@/persistence/schemas/requirementSchema";

export const perkSchema = entitySchema.extend
({
  grade: numberInput(z.coerce.number<number>().int().min(0, { message: "Ranga musi mieć co najmniej 0." }).max(20, { message: "Ranga musi być najwyżej 20." })),
  description: z.string().min(0).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
  // Structured requirements (sole model after the legacy `requirements` cutover).
  structuredRequirements: requirementsSchema.optional(),
  // ROADMAP 8.6 — names of entities this one replaces. Not a requirement.
  // Blank rows are stripped here rather than in the editor (8.9): the "+ Dodaj"
  // button seeds an empty entry, and every form that touches perks — compendium
  // edit, add sheet, character sheet — goes through this schema.
  //
  // `.optional()` must wrap the transform, not precede it: a transform on an
  // optional field yields `replaces: string[] | undefined` as a REQUIRED key,
  // which quietly breaks every caller that spreads a domain object into a DTO
  // (`Power[]` → `powers`, see useCreateCharacterFromCopy). Wrapped this way the
  // key stays optional and the transform only runs when a value is present.
  replaces: z.array(z.string()).transform((names) => names.map((name) => name.trim()).filter((name) => name.length > 0)).optional(),
  price: numberInput(z.coerce.number<number>().int().min(0, { message: "Cena musi mieć co najmniej 0." }).max(180, { message: "Cena musi być najwyżej 180." })),
  tags: tagsSchema
});

export const addPerkSchema = perkSchema.omit({ id: true });

export const perksSchema = z.array(perkSchema).max(500, { message: "Możesz mieć najwyżej 500 manewrów." });

export type PerkDto = z.infer<typeof perkSchema>;
export type AddPerkDto = z.infer<typeof addPerkSchema>;