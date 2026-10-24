import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";

export const mountSchema = itemSchema.extend
({
  paceSpeed: numberInput(z.coerce.number<number>().int().min(1, { message: "Prędkość cwału musi mieć co najmniej 1." }).max(50, { message: "Prędkość cwału musi mieć najwyżej 50." })),
  gallopSpeed: numberInput(z.coerce.number<number>().int().min(1, { message: "Prędkość galopu musi mieć co najmniej 1." }).max(100, { message: "Prędkość galopu musi mieć najwyżej 100." })),
  canterSpeed: numberInput(z.coerce.number<number>().int().min(1, { message: "Prędkość kłusa musi mieć co najmniej 1." }).max(175, { message: "Prędkość kłusa musi mieć najwyżej 175." })),
  horsemanshipBonus: numberInput(z.coerce.number<number>().int().min(-10, { message: "Bonus jeździecki musi mieć co najmniej -10." }).max(20, { message: "Bonus jeździecki musi mieć najwyżej 20." })),
});

export type MountDto = z.infer<typeof mountSchema>;