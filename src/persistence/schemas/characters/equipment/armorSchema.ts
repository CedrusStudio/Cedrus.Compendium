import { z } from "zod";
import { defenseItemSchema } from "@/persistence/schemas/characters/equipment/defenseItemSchema";

export const armorSchema = defenseItemSchema.extend
({
  immunity: z.coerce.number<number>().int().min(0, { message: "Niewrażliwość musi mieć co najmniej 0." }).max(10, { message: "Niewrażliwość musi mieć najwyżej 10." }),
  protection: z.coerce.number<number>().int().min(0, { message: "Pancerz musi mieć co najmniej 0." }).max(50, { message: "Pancerz musi mieć najwyżej 50." }),
});