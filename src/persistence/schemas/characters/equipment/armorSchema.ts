import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { defenseItemSchema } from "@/persistence/schemas/characters/equipment/defenseItemSchema";

export const armorSchema = defenseItemSchema.extend
({
  immunity: numberInput(z.coerce.number<number>().int().min(0, { message: "Niewrażliwość musi mieć co najmniej 0." }).max(10, { message: "Niewrażliwość musi mieć najwyżej 10." })),
  protection: numberInput(z.coerce.number<number>().int().min(0, { message: "Pancerz musi mieć co najmniej 0." }).max(50, { message: "Pancerz musi mieć najwyżej 50." })),
});

export type ArmorDto = z.infer<typeof armorSchema>;