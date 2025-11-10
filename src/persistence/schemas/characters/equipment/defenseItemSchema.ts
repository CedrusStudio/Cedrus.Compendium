import { z } from "zod";
import { itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";

export const defenseItemSchema = itemSchema.extend
({
  resistance: z.coerce.number<number>().int().min(0, { message: "Odporność musi mieć co najmniej 0." }).max(100, { message: "Odporność musi mieć najwyżej 100." }),
  dexterityRestriction: z.coerce.number<number>().int().min(-10, { message: "Ograniczenie zręczności musi mieć co najmniej -10." }).max(10, { message: "Ograniczenie zręczności musi mieć najwyżej 10." }),
  reflexRestriction: z.coerce.number<number>().int().min(0, { message: "Ograniczenie refleksu musi mieć co najmniej 0." }).max(10, { message: "Ograniczenie refleksu musi mieć najwyżej 10." }),
  initiativeRestriction: z.coerce.number<number>().int().min(0, { message: "Ograniczenie inicjatywy musi mieć co najmniej 0." }).max(10, { message: "Ograniczenie inicjatywy musi mieć najwyżej 10." }),
  attributePenalty: z.coerce.number<number>().int().min(0, { message: "Kara za atrybut musi mieć co najmniej 0." }).max(10, { message: "Kara za atrybut musi mieć najwyżej 10." }),
  strengthRequirement: z.coerce.number<number>().int().min(0, { message: "Wymaganie siły musi mieć co najmniej 0." }).max(20, { message: "Wymaganie siły musi mieć najwyżej 20." }),
});

export type DefensiveItemDto = z.infer<typeof defenseItemSchema>;