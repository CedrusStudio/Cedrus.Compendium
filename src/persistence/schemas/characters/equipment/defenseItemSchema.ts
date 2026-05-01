import { z } from "zod";
import { itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";

export const defenseItemSchema = itemSchema.extend
({
  resistance: z.coerce.number<number>().int().min(0, { message: "Odporność musi mieć co najmniej 0." }).max(100, { message: "Odporność musi mieć najwyżej 100." }).default(0),
  dexterityRestriction: z.coerce.number<number>().int().min(-10, { message: "Ograniczenie zręczności musi mieć co najmniej -10." }).max(20, { message: "Ograniczenie zręczności musi mieć najwyżej 20." }).default(0),
  reflexRestriction: z.coerce.number<number>().int().min(-10, { message: "Ograniczenie refleksu musi mieć co najmniej -10." }).max(20, { message: "Ograniczenie refleksu musi mieć najwyżej 20." }).default(0),
  initiativeRestriction: z.coerce.number<number>().int().min(-10, { message: "Ograniczenie inicjatywy musi mieć co najmniej -10." }).max(20, { message: "Ograniczenie inicjatywy musi mieć najwyżej 20." }).default(0),
  attributePenalty: z.coerce.number<number>().int().min(-10, { message: "Kara za atrybut musi mieć co najmniej -10." }).max(20, { message: "Kara za atrybut musi mieć najwyżej 20." }).default(0),
  strengthRequirement: z.coerce.number<number>().int().min(-10, { message: "Wymaganie siły musi mieć co najmniej -10." }).max(20, { message: "Wymaganie siły musi mieć najwyżej 20." }).default(0),
});

export type DefensiveItemDto = z.infer<typeof defenseItemSchema>;