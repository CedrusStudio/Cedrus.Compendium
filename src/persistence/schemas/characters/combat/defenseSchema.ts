import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";

const optionalCombatDescriptionSchema = z.union([
  z.literal(""),
  z.string().min(2).max(1000),
]).optional();

export const defenseSchema = entitySchema.extend
({
  description: optionalCombatDescriptionSchema,
  immunity: z.coerce.number<number>().int().min(0, { message: "Niewrażliwość musi mieć co najmniej 0." }).max(50, { message: "Niewrażliwość musi mieć najwyżej 50." }),
  resistance: z.coerce.number<number>().int().min(0, { message: "Odporność musi mieć co najmniej 0." }).max(50, { message: "Odporność musi mieć najwyżej 50." }),
  protection: z.coerce.number<number>().int().min(0, { message: "Pancerz musi mieć co najmniej 0." }).max(50, { message: "Pancerz musi mieć najwyżej 50." }),
  block: z.coerce.number<number>().int().min(0, { message: "Blokowanie musi mieć co najmniej 0." }).max(50, { message: "Blokada musi mieć najwyżej 50." }),
  parry: z.coerce.number<number>().int().min(0, { message: "Parowanie musi mieć co najmniej 0." }).max(50, { message: "Parowanie musi mieć najwyżej 50." }),
  dodge: z.coerce.number<number>().int().min(0, { message: "Unikanie musi mieć co najmniej 0." }).max(50, { message: "Unikanie musi mieć najwyżej 50." }),
  bonus: z.coerce.number<number>().int().min(-50, { message: "Bonus musi mieć co najmniej -50." }).max(1000, { message: "Bonus musi mieć najwyżej 1000." })
});

export type DefenseDto = z.infer<typeof defenseSchema>;